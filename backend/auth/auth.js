const express = require("express");
const bcrypt = require("bcrypt");
const { supabase } = require("../supabaseClient");
const router = express.Router();

/**
 * POST /auth/register/student
 * Register a new student
 */
router.post("/register/student", async (req, res) => {
  try {
    const { email, password, phone, school_name, field_of_study, academic_year } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash,
        role: "student",
        phone: phone || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create student profile
    const { error: profileError } = await supabase
      .from("student_profiles")
      .insert({
        id: newUser.id,
        school_name: school_name || null,
        field_of_study: field_of_study || null,
        academic_year: academic_year || null,
        radius_km: 10, // default
        verification_status: "pending",
        active_since: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    // Return user info (without password)
    res.status(201).json({
      message: "Student registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error registering student:", err);
    res.status(500).json({ error: "Failed to register student" });
  }
});

/**
 * POST /auth/login
 * Login a user (student or client)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, password_hash, role, phone, created_at")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get student profile if role is student
    let profile = null;
    if (user.role === "student") {
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("school_name, field_of_study, academic_year, radius_km, verification_status")
        .eq("id", user.id)
        .single();
      
      profile = studentProfile;
    }

    // Return user info (without password)
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
        profile: profile,
      },
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

module.exports = router;