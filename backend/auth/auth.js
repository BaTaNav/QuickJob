const express = require("express");
const bcrypt = require("bcrypt");
const { supabase } = require("../supabaseClient");
const { signToken } = require("./jwt");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role, phone, created_at")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    // OPTIONAL: fetch profile based on role (student/client/admin) if you want
    let profile = null;
    if (user.role === "student") {
      const { data } = await supabase
        .from("student_profiles")
        .select("school_name, field_of_study, academic_year, radius_km, verification_status")
        .eq("id", user.id)
        .single();
      profile = data || null;
    }

    const access_token = signToken(user);

    res.json({
      message: "Login successful",
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
        profile,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
