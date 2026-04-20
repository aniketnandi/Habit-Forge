require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const configurePassport = require("./db/passport");
const { connectDB } = require("./db/connection");

const habitsRouter = require("./routes/habits");
const logsRouter = require("./routes/logs");
const analyticsRouter = require("./routes/analytics");
const goalsRouter = require("./routes/goals");
const authRouter = require("./routes/auth");
const requireAuth = require("./middleware/requireAuth");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "habitforge-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Passport
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());
app.set("passport", passport);

// Public routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/habits", requireAuth, habitsRouter);
app.use("/api/logs", requireAuth, logsRouter);
app.use("/api/analytics", requireAuth, analyticsRouter);
app.use("/api/goals", requireAuth, goalsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res) => {
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
