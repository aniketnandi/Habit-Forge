const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connection");

const router = express.Router();

// Helper: compute current streak and longest streak from sorted date strings (desc)
function computeStreaks(sortedDatesDesc) {
  if (!sortedDatesDesc.length) return { current: 0, longest: 0 };

  const dates = [...sortedDatesDesc].sort(); // asc for processing
  let longest = 1;
  let run = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  // Current streak: count backwards from today
  const today = new Date().toISOString().split("T")[0];
  const dateSet = new Set(dates);
  let current = 0;
  let check = new Date(today);

  while (true) {
    const ds = check.toISOString().split("T")[0];
    if (dateSet.has(ds)) {
      current++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest };
}

// Helper: get the ISO week start (Monday) for a given date string
function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

// GET /api/analytics/streak/:habitId
// Returns current streak and longest streak
router.get("/streak/:habitId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const db = getDB();
    const habitId = new ObjectId(req.params.habitId);

    const habit = await db.collection("habits").findOne({ _id: habitId });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const logs = await db
      .collection("logs")
      .find({ habitId })
      .project({ logDate: 1 })
      .toArray();

    const dates = logs.map((l) => l.logDate);
    const { current, longest } = computeStreaks(dates);

    res.json({ habitId: req.params.habitId, habitName: habit.name, current, longest });
  } catch (err) {
    console.error("GET /analytics/streak/:habitId error:", err);
    res.status(500).json({ error: "Failed to compute streak" });
  }
});

// GET /api/analytics/weekly/:habitId
// Returns weekly completion percentage for the current week
router.get("/weekly/:habitId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const db = getDB();
    const habitId = new ObjectId(req.params.habitId);

    const habit = await db.collection("habits").findOne({ _id: habitId });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const today = new Date().toISOString().split("T")[0];
    const weekStart = getWeekStart(today);

    const logs = await db
      .collection("logs")
      .find({ habitId, logDate: { $gte: weekStart, $lte: today } })
      .toArray();

    const logsThisWeek = logs.length;
    const target =
      habit.frequency === "daily" ? 7 : habit.targetCount;
    const percentage = Math.min(Math.round((logsThisWeek / target) * 100), 100);

    res.json({
      habitId: req.params.habitId,
      habitName: habit.name,
      weekStart,
      logsThisWeek,
      target,
      percentage,
    });
  } catch (err) {
    console.error("GET /analytics/weekly/:habitId error:", err);
    res.status(500).json({ error: "Failed to compute weekly stats" });
  }
});

// GET /api/analytics/summary?sort=completion|streak|name
// Returns all habits with their analytics, sorted
router.get("/summary", async (req, res) => {
  try {
    const sort = req.query.sort || "completion";
    const db = getDB();

    const habits = await db.collection("habits").find({}).toArray();
    if (!habits.length) return res.json([]);

    const today = new Date().toISOString().split("T")[0];
    const weekStart = getWeekStart(today);

    const summaries = await Promise.all(
      habits.map(async (habit) => {
        const logs = await db
          .collection("logs")
          .find({ habitId: habit._id })
          .project({ logDate: 1 })
          .toArray();

        const dates = logs.map((l) => l.logDate);
        const { current, longest } = computeStreaks(dates);

        const weeklyLogs = dates.filter((d) => d >= weekStart && d <= today).length;
        const target = habit.frequency === "daily" ? 7 : habit.targetCount;
        const weeklyPct = Math.min(Math.round((weeklyLogs / target) * 100), 100);

        const totalDays =
          Math.max(
            1,
            Math.round(
              (new Date(today) - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)
            )
          );
        const overallPct = Math.min(Math.round((dates.length / totalDays) * 100), 100);

        return {
          ...habit,
          currentStreak: current,
          longestStreak: longest,
          weeklyPct,
          overallPct,
          totalLogs: dates.length,
        };
      })
    );

    const sorted = summaries.sort((a, b) => {
      if (sort === "streak") return b.currentStreak - a.currentStreak;
      if (sort === "longest") return b.longestStreak - a.longestStreak;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.weeklyPct - a.weeklyPct; // default: completion
    });

    res.json(sorted);
  } catch (err) {
    console.error("GET /analytics/summary error:", err);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

// GET /api/analytics/range/:habitId?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns analytics for a specific date range
router.get("/range/:habitId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ error: "Invalid habit ID" });
    }

    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "start and end query parameters are required" });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return res.status(400).json({ error: "Dates must be in YYYY-MM-DD format" });
    }
    if (start > end) {
      return res.status(400).json({ error: "start must be before or equal to end" });
    }

    const db = getDB();
    const habitId = new ObjectId(req.params.habitId);

    const habit = await db.collection("habits").findOne({ _id: habitId });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const logs = await db
      .collection("logs")
      .find({ habitId, logDate: { $gte: start, $lte: end } })
      .sort({ logDate: 1 })
      .toArray();

    const dates = logs.map((l) => l.logDate);
    const { current, longest } = computeStreaks(dates);

    // Days in range
    const startD = new Date(start);
    const endD = new Date(end);
    const totalDaysInRange = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

    const completionRate = Math.min(
      Math.round((dates.length / totalDaysInRange) * 100),
      100
    );

    // Weekly breakdown
    const weeklyMap = {};
    for (const date of dates) {
      const ws = getWeekStart(date);
      weeklyMap[ws] = (weeklyMap[ws] || 0) + 1;
    }
    const weeklyBreakdown = Object.entries(weeklyMap)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json({
      habitId: req.params.habitId,
      habitName: habit.name,
      start,
      end,
      totalDaysInRange,
      totalLogs: dates.length,
      completionRate,
      currentStreak: current,
      longestStreak: longest,
      weeklyBreakdown,
    });
  } catch (err) {
    console.error("GET /analytics/range/:habitId error:", err);
    res.status(500).json({ error: "Failed to compute range analytics" });
  }
});

module.exports = router;