const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const supabase = require("../supabaseClient");

// Root
router.get("/", (req, res) => {
  res.json({ message: "Auth API" });
});

// Student Registration
router.post("/register/student", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      return res.status(500).json({ error: "Database error", details: checkError });
    }

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student in users table
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: hashedPassword,
          role: "student",
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, email, role")
      .single();

    if (insertError) {
      console.error("Registration insert error:", insertError);
      return res.status(500).json({ error: "Registration failed", details: insertError });
    }

    return res.status(201).json({
      message: "Student registered successfully",
      user: newUser,
      token: "dev-placeholder-token",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Student Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Look up user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Login lookup error:", error);
      return res.status(500).json({ error: "Login failed" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Validate password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;

    return res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: "dev-placeholder-token",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
