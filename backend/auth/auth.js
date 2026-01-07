const express = require("express");
const router = express.Router();

// Simple placeholder root
router.get("/", (req, res) => {
  res.json({ message: "Auth API placeholder" });
});

// Placeholder login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // TODO: Implement real login with Supabase users
    // For now, return a mock user to keep the app flowing during development
    res.json({
      user: {
        id: 1,
        email,
        role: "student",
      },
      token: "dev-placeholder-token",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Placeholder student registration endpoint
router.post("/register/student", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // TODO: Implement real registration into Supabase users table
    res.status(201).json({
      user: {
        id: 2,
        email,
        role: "student",
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
