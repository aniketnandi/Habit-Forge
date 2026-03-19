const express = require("express");
const bcrypt = require("bcrypt");
const { getDB } = require("../db/connection");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = getDB();
    const existing = await db
      .collection("users")
      .findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);
    const user = { _id: result.insertedId, username: newUser.username };

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Login after register failed" });
      res.status(201).json({ user });
    });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", (req, res, next) => {
  const passport = req.app.get("passport");
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Authentication error" });
    if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });

    req.login(user, (loginErr) => {
      if (loginErr) return res.status(500).json({ error: "Login failed" });
      res.json({ user: { _id: user._id, username: user.username } });
    });
  })(req, res, next);
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: { _id: req.user._id, username: req.user.username } });
});

module.exports = router;
