require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;

const HABIT_TEMPLATES = [
  { name: "Daily Coding Practice", category: "Study", frequency: "daily", targetCount: 1 },
  { name: "LeetCode Problem", category: "Study", frequency: "daily", targetCount: 1 },
  { name: "Read 30 Minutes", category: "Study", frequency: "daily", targetCount: 1 },
  { name: "Gym Workout", category: "Fitness", frequency: "weekly", targetCount: 3 },
  { name: "Morning Run", category: "Fitness", frequency: "daily", targetCount: 1 },
  { name: "Meditation", category: "Mindfulness", frequency: "daily", targetCount: 1 },
  { name: "Journaling", category: "Mindfulness", frequency: "daily", targetCount: 1 },
  { name: "Drink 8 Glasses of Water", category: "Health", frequency: "daily", targetCount: 1 },
  { name: "Sleep Before Midnight", category: "Health", frequency: "daily", targetCount: 1 },
  { name: "Practice Guitar", category: "Other", frequency: "weekly", targetCount: 4 },
  { name: "Interview Prep", category: "Study", frequency: "daily", targetCount: 1 },
  { name: "Yoga", category: "Fitness", frequency: "weekly", targetCount: 3 },
  { name: "Cold Shower", category: "Health", frequency: "daily", targetCount: 1 },
  { name: "No Social Media", category: "Mindfulness", frequency: "daily", targetCount: 1 },
  { name: "Walk 10,000 Steps", category: "Fitness", frequency: "daily", targetCount: 1 },
];

const NOTES_OPTIONS = [
  "Felt great today!",
  "Struggled a bit but finished.",
  "Personal best!",
  "Short session but consistent.",
  "Focused and productive.",
  "Tired but showed up.",
  "",
  "",
  "",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isoDate(date) {
  return date.toISOString().split("T")[0];
}

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db("habitforge");

    console.log("Dropping existing collections...");
    await db.collection("habits").drop().catch(() => {});
    await db.collection("logs").drop().catch(() => {});

    console.log("Seeding habits...");
    const now = new Date();
    const habits = HABIT_TEMPLATES.map((template, i) => ({
      ...template,
      createdAt: addDays(now, -randomInt(30, 365)),
      updatedAt: addDays(now, -randomInt(0, 10)),
    }));

    const insertedHabits = await db.collection("habits").insertMany(habits);
    const habitIds = Object.values(insertedHabits.insertedIds);
    console.log(`Inserted ${habitIds.length} habits.`);

    console.log("Seeding logs...");
    const logs = [];
    const seenDates = new Map();

    // For each habit, generate logs over the past year
    for (const habitId of habitIds) {
      const habitKey = habitId.toString();
      seenDates.set(habitKey, new Set());

      const habit = habits[habitIds.indexOf(habitId)];
      const daysBack = randomInt(90, 365);
      const startDate = addDays(now, -daysBack);

      // Simulate realistic consistency: 60–90% completion rate
      for (let d = 0; d <= daysBack; d++) {
        const date = addDays(startDate, d);
        const dateStr = isoDate(date);

        // Skip future dates
        if (date > now) continue;

        // For weekly habits, only attempt on certain days
        if (habit.frequency === "weekly") {
          const dayOfWeek = date.getDay();
          // Roughly 3 out of 7 days for weekly habits
          if (![1, 3, 5].includes(dayOfWeek)) continue;
        }

        // 70% chance of logging on any given qualifying day
        if (Math.random() > 0.7) continue;

        // Prevent duplicates for the same habit+date
        if (seenDates.get(habitKey).has(dateStr)) continue;
        seenDates.get(habitKey).add(dateStr);

        logs.push({
          habitId: habitId,
          logDate: dateStr,
          notes: randomItem(NOTES_OPTIONS),
          createdAt: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            randomInt(6, 23),
            randomInt(0, 59),
            0
          ),
        });
      }
    }

    // Insert in batches to avoid memory issues
    const BATCH_SIZE = 500;
    let totalInserted = 0;
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
      const batch = logs.slice(i, i + BATCH_SIZE);
      await db.collection("logs").insertMany(batch);
      totalInserted += batch.length;
    }

    console.log(`Inserted ${totalInserted} logs.`);

    // Create indexes for performance
    await db.collection("habits").createIndex({ category: 1 });
    await db.collection("habits").createIndex({ frequency: 1 });
    await db.collection("logs").createIndex({ habitId: 1, logDate: 1 }, { unique: true });
    await db.collection("logs").createIndex({ logDate: 1 });
    console.log("Indexes created.");

    console.log(`\nSeed complete! ${habitIds.length} habits, ${totalInserted} logs.`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});