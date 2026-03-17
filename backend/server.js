require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/connection");

const habitsRouter = require("./routes/habits");
const logsRouter = require("./routes/logs");
const analyticsRouter = require("./routes/analytics");
const goalsRouter = require("./routes/goals");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Allow frontend dev server (Vite default: 5173) and production
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Routes
app.use("/api/habits", habitsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/goals", goalsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server only after DB connects
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HabitForge API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
