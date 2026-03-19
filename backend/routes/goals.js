const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connection");

const router = express.Router();

// GET /api/goals - get all goals
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const goals = await db.collection("goals").find({}).toArray();
    res.json(goals);
  } catch (err) {
    console.error("GET /goals error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// GET /api/goals/:habitId - get goal for a specific habit
router.get("/:habitId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }
    const db = getDB();
    const goal = await db
      .collection("goals")
      .findOne({ habitId: new ObjectId(req.params.habitId) });
    if (!goal) return res.status(404).json({ error: "No goal set for this habit" });
    res.json(goal);
  } catch (err) {
    console.error("GET /goals/:habitId error:", err);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// POST /api/goals - create a goal for a habit
router.post("/", async (req, res) => {
  try {
    const { habitId, targetPct } = req.body;

    if (!habitId || targetPct === undefined) {
      return res.status(400).json({ error: "habitId and targetPct are required" });
    }
    if (!ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: "Invalid habitId" });
    }
    const pct = Number(targetPct);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return res.status(400).json({ error: "targetPct must be between 1 and 100" });
    }

    const db = getDB();
    const habitObjId = new ObjectId(habitId);

    // Verify habit exists
    const habit = await db.collection("habits").findOne({ _id: habitObjId, userId: req.user._id });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    // Only one goal per habit
    const existing = await db.collection("goals").findOne({ habitId: habitObjId });
    if (existing) {
      return res
        .status(409)
        .json({ error: "A goal for this habit already exists. Use PUT to update it." });
    }

    const newGoal = {
      habitId: habitObjId,
      habitName: habit.name,
      targetPct: pct,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("goals").insertOne(newGoal);
    res.status(201).json({ ...newGoal, _id: result.insertedId });
  } catch (err) {
    console.error("POST /goals error:", err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// PUT /api/goals/:id - update a goal
router.put("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid goal ID" });
    }

    const { targetPct } = req.body;
    if (targetPct === undefined) {
      return res.status(400).json({ error: "targetPct is required" });
    }
    const pct = Number(targetPct);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return res.status(400).json({ error: "targetPct must be between 1 and 100" });
    }

    const db = getDB();
    const result = await db
      .collection("goals")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { targetPct: pct, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

    if (!result) return res.status(404).json({ error: "Goal not found" });
    res.json(result);
  } catch (err) {
    console.error("PUT /goals/:id error:", err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// DELETE /api/goals/:id - delete a goal
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid goal ID" });
    }

    const db = getDB();
    const result = await db.collection("goals").deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (err) {
    console.error("DELETE /goals/:id error:", err);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

module.exports = router;
