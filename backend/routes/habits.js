const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connection");

const router = express.Router();

// GET /api/habits — list all habits
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const habits = await db.collection("habits").find({}).sort({ createdAt: -1 }).toArray();
    res.json(habits);
  } catch (err) {
    console.error("GET /habits error:", err);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// GET /api/habits/:id — get single habit
router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }
    const db = getDB();
    const habit = await db
      .collection("habits")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    res.json(habit);
  } catch (err) {
    console.error("GET /habits/:id error:", err);
    res.status(500).json({ error: "Failed to fetch habit" });
  }
});

// POST /api/habits — create a new habit
router.post("/", async (req, res) => {
  try {
    const { name, category, frequency, targetCount } = req.body;

    if (!name || !category || !frequency) {
      return res.status(400).json({ error: "name, category, and frequency are required" });
    }
    if (!["daily", "weekly"].includes(frequency)) {
      return res.status(400).json({ error: "frequency must be 'daily' or 'weekly'" });
    }
    if (name.trim().length === 0 || name.trim().length > 80) {
      return res.status(400).json({ error: "name must be between 1 and 80 characters" });
    }

    const validCategories = ["Study", "Fitness", "Health", "Mindfulness", "Other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` });
    }

    const newHabit = {
      name: name.trim(),
      category,
      frequency,
      targetCount: frequency === "daily" ? 1 : Math.min(Math.max(Number(targetCount) || 3, 1), 7),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();
    const result = await db.collection("habits").insertOne(newHabit);
    res.status(201).json({ ...newHabit, _id: result.insertedId });
  } catch (err) {
    console.error("POST /habits error:", err);
    res.status(500).json({ error: "Failed to create habit" });
  }
});

// PUT /api/habits/:id — update a habit
router.put("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const { name, category, frequency, targetCount } = req.body;

    if (!name || !category || !frequency) {
      return res.status(400).json({ error: "name, category, and frequency are required" });
    }
    if (!["daily", "weekly"].includes(frequency)) {
      return res.status(400).json({ error: "frequency must be 'daily' or 'weekly'" });
    }
    if (name.trim().length === 0 || name.trim().length > 80) {
      return res.status(400).json({ error: "name must be between 1 and 80 characters" });
    }

    const validCategories = ["Study", "Fitness", "Health", "Mindfulness", "Other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` });
    }

    const updates = {
      name: name.trim(),
      category,
      frequency,
      targetCount: frequency === "daily" ? 1 : Math.min(Math.max(Number(targetCount) || 3, 1), 7),
      updatedAt: new Date(),
    };

    const db = getDB();
    const result = await db
      .collection("habits")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updates },
        { returnDocument: "after" }
      );

    if (!result) return res.status(404).json({ error: "Habit not found" });
    res.json(result);
  } catch (err) {
    console.error("PUT /habits/:id error:", err);
    res.status(500).json({ error: "Failed to update habit" });
  }
});

// DELETE /api/habits/:id — delete a habit and all its logs
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const db = getDB();
    const habitId = new ObjectId(req.params.id);

    const deleted = await db.collection("habits").deleteOne({ _id: habitId });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }

    // Cascade delete all related logs
    const logsDeleted = await db.collection("logs").deleteMany({ habitId });

    res.json({
      message: "Habit and all related logs deleted",
      logsDeleted: logsDeleted.deletedCount,
    });
  } catch (err) {
    console.error("DELETE /habits/:id error:", err);
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

module.exports = router;