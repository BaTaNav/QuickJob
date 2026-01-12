const express = require("express");
const bcrypt = require("bcrypt");
const supabaseModule = require("../supabaseClient");
const jwt = require("jsonwebtoken");
const verifyJwt = require("../auth/verifyJwt");
const requireRole = require("../auth/requireRole");

// ✅ Rate limiters
const {
  loginLimiter,
  adminLimiter,
  slowDownAdmin,
} = require("../auth/rateLimiters");

const router = express.Router();
const supabase = supabaseModule.supabase || supabaseModule;


router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email en password zijn verplicht." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET ontbreekt in environment");
      return res.status(500).json({ message: "Serverconfiguratie fout." });
    }

    const normEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, password_hash, role, phone, preferred_language, two_factor_enabled, created_at"
      )
      .eq("email", normEmail)
      .eq("role", "client")
      .maybeSingle();

    if (error) {
      console.error("Login select error:", error);
      return res
        .status(500)
        .json({ message: "Interne serverfout.", supabaseError: error });
    }

    if (!user) {
      return res.status(401).json({ message: "Ongeldige email of password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Ongeldige email of password." });
    }

    // JWT payload
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return res.status(200).json({
      message: "Succesvol ingelogd.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        two_factor_enabled: user.two_factor_enabled,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error (catch):", err);
    return res
      .status(500)
      .json({ message: "Interne serverfout.", nodeError: String(err) });
  }
});

/* =========================
   🔒 PROTECTED ADMIN AREA
   ========================= */
router.use(verifyJwt, requireRole("admin"), slowDownAdmin, adminLimiter);

/* =========================
   USER MANAGEMENT
   ========================= */

// GET /admin/users
router.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      total: data.length,
      users: data,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "User niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({ user: data });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/users/:id
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, phone, preferred_language, two_factor_enabled } = req.body;

    const updates = {};
    if (email) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (preferred_language) updates.preferred_language = preferred_language;
    if (two_factor_enabled !== undefined) updates.two_factor_enabled = two_factor_enabled;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Geen velden om te updaten." });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "User succesvol geüpdatet.",
      user: data,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .select("id, email, role")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "User niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: "User succesvol verwijderd.",
      deleted_user: data,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["student", "client", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Ongeldige role. Kies uit: student, client, admin",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, email, role, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: `Role succesvol gewijzigd naar ${role}.`,
      user: data,
    });
  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
