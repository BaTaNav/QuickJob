const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

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

    // Look up user by email and return role (dev-mode: no password check)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found: simple heuristic fallback for dev
      const guessedRole = email.toLowerCase().includes("client")
        ? "client"
        : email.toLowerCase().includes("admin")
        ? "admin"
        : "student";
      return res.json({
        user: {
          id: 9999,
          email,
          role: guessedRole,
        },
        token: "dev-placeholder-token",
      });
    }
    if (error) {
      console.error("Login lookup error:", error);
      return res.status(500).json({ error: "Login failed" });
    }

    // Found user: return their role
    return res.json({
      user,
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
