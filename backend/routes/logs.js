const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connection");

const router = express.Router();

// GET /api/logs/:habitId — get all logs for a habit
router.get("/:habitId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const db = getDB();
    const habitId = new ObjectId(req.params.habitId);

    // Verify habit exists
    const habit = await db.collection("habits").findOne({ _id: habitId });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const logs = await db
      .collection("logs")
      .find({ habitId })
      .sort({ logDate: -1 })
      .toArray();

    res.json(logs);
  } catch (err) {
    console.error("GET /logs/:habitId error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// POST /api/logs — create a completion log
router.post("/", async (req, res) => {
  try {
    const { habitId, logDate, notes } = req.body;

    if (!habitId || !logDate) {
      return res.status(400).json({ error: "habitId and logDate are required" });
    }
    if (!ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: "Invalid habitId" });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(logDate)) {
      return res.status(400).json({ error: "logDate must be in YYYY-MM-DD format" });
    }

    // Don't allow future dates
    const today = new Date().toISOString().split("T")[0];
    if (logDate > today) {
      return res.status(400).json({ error: "Cannot log a future date" });
    }

    const db = getDB();
    const habitObjId = new ObjectId(habitId);

    // Verify habit exists
    const habit = await db.collection("habits").findOne({ _id: habitObjId });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    // Prevent duplicate log for same habit + date
    const existing = await db
      .collection("logs")
      .findOne({ habitId: habitObjId, logDate });
    if (existing) {
      return res.status(409).json({ error: "A log for this habit on this date already exists" });
    }

    const newLog = {
      habitId: habitObjId,
      logDate,
      notes: (notes || "").trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("logs").insertOne(newLog);
    res.status(201).json({ ...newLog, _id: result.insertedId });
  } catch (err) {
    console.error("POST /logs error:", err);
    res.status(500).json({ error: "Failed to create log" });
  }
});

// DELETE /api/logs/:id — delete a single log entry
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid log ID" });
    }

    const db = getDB();
    const result = await db
      .collection("logs")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    console.error("DELETE /logs/:id error:", err);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

module.exports = router;