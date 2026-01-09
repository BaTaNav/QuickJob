const express = require("express");
const bcrypt = require("bcrypt");
const supabaseModule = require("../supabaseClient");
const jwt = require("jsonwebtoken");

const verifyJwt = require("../auth/verifyJwt");
const requireRole = require("../auth/requireRole");

const {
  loginLimiter,
  authLimiter,
  slowDownAuth,
  createJobLimiter,
} = require("../auth/rateLimiters");

const router = express.Router();

// IMPORTANT: support both export styles of supabaseClient
const supabase = supabaseModule.supabase || supabaseModule;

/**
 * Only allow:
 * - admin OR
 * - client whose token.sub matches req.params.id
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user?.sub) return res.status(401).json({ error: "Unauthorized" });

  // allow admin to do anything (keep if you want admin to access clients)
  if (req.user.role === "admin") return next();

  // only allow clients for themselves
  if (req.user.role !== "client") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (String(req.user.sub) !== String(req.params.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

/* =========================
   PUBLIC ROUTES
   ========================= */

// POST /clients/register-client - Register new client
router.post("/register-client", async (req, res) => {
  try {
    const {
      email,
      password,
      phone = null,
      preferred_language = "nl",
      two_factor_enabled = false,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email en password zijn verplicht." });
    }

    const normEmail = email.trim().toLowerCase();

    const allowedLangs = ["nl", "fr", "en"];
    const lang = allowedLangs.includes(preferred_language)
      ? preferred_language
      : "nl";

    // Check if email already exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normEmail);

    if (existingError) {
      console.error("Error checking existing user:", existingError);
      return res.status(500).json({
        message: "Interne serverfout (existing check).",
        supabaseError: existingError,
      });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: "Email bestaat al." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new client user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: normEmail,
          password_hash,
          role: "client",
          phone,
          preferred_language: lang,
          two_factor_enabled,
        },
      ])
      .select(
        "id, email, role, phone, preferred_language, two_factor_enabled, created_at"
      )
      .single();

    if (error) {
      console.error("Error inserting user:", error);
      return res.status(500).json({
        message: "Interne serverfout (insert).",
        supabaseError: error,
      });
    }

    return res.status(201).json({
      message: "Client succesvol geregistreerd.",
      user: data,
    });
  } catch (err) {
    console.error("Register error (catch):", err);
    return res.status(500).json({
      message: "Interne serverfout (catch).",
      nodeError: String(err),
    });
  }
});

// POST /clients/login - Login client (+ JWT token)
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
   PROTECTED ROUTES
   Everything below REQUIRES token + rate limit
   ========================= */
router.use(verifyJwt, requireRole("client", "admin"), slowDownAuth, authLimiter);

/* =========================
   CLIENT PROFILE ROUTES (protected)
   ========================= */

// GET /clients/:id - Get one client (including profile)
router.get("/:id", requireSelfOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, role, phone, preferred_language, two_factor_enabled, created_at"
      )
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (userError && userError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (userError) throw userError;

    // Fetch client profile
    const { data: profile, error: profileError } = await supabase
      .from("client_profiles")
      .select("address_line, postal_code, city, region, first_job_needs_approval")
      .eq("id", id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    const combinedClient = { ...user, ...(profile || {}) };

    res.status(200).json({ client: combinedClient });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /clients/:id
router.patch("/:id", requireSelfOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      password,
      phone,
      preferred_language,
      two_factor_enabled,
      address_line,
      postal_code,
      city,
      region,
      first_job_needs_approval,
    } = req.body;

    // Update users table
    const updatesUser = {};
    if (email) updatesUser.email = email.trim().toLowerCase();
    if (phone !== undefined) updatesUser.phone = phone;
    if (preferred_language) updatesUser.preferred_language = preferred_language;
    if (two_factor_enabled !== undefined)
      updatesUser.two_factor_enabled = two_factor_enabled;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatesUser.password_hash = await bcrypt.hash(password, salt);
    }

    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update(updatesUser)
      .eq("id", id)
      .eq("role", "client")
      .select(
        "id, email, role, phone, preferred_language, two_factor_enabled, created_at"
      )
      .maybeSingle();

    if (userError) throw userError;

    // Update client_profiles table or insert if not exists
    const updatesProfile = {};
    if (address_line !== undefined) updatesProfile.address_line = address_line;
    if (postal_code !== undefined) updatesProfile.postal_code = postal_code;
    if (city !== undefined) updatesProfile.city = city;
    if (region !== undefined) updatesProfile.region = region;
    if (first_job_needs_approval !== undefined)
      updatesProfile.first_job_needs_approval = first_job_needs_approval;

    let updatedProfile = null;
    if (Object.keys(updatesProfile).length > 0) {
      const { data: existingProfile, error: profileError } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (existingProfile) {
        const { data, error: updateProfileError } = await supabase
          .from("client_profiles")
          .update(updatesProfile)
          .eq("id", id)
          .single();
        if (updateProfileError) throw updateProfileError;
        updatedProfile = data;
      } else {
        const { data, error: insertProfileError } = await supabase
          .from("client_profiles")
          .insert([{ id, ...updatesProfile }])
          .select("*")
          .single();
        if (insertProfileError) throw insertProfileError;
        updatedProfile = data;
      }
    }

    res.status(200).json({
      message: "Client profile updated successfully",
      client: updatedUser,
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("Update client error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /clients/:id - Delete client
router.delete("/:id", requireSelfOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "client")
      .select("id")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (error) throw error;

    res.status(200).json({
      message: "Client deleted successfully",
      client_id: id,
    });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   JOBS ROUTES (protected)
   ========================= */

// POST /clients/:id/jobs - Create job (extra strict rate limit)
router.post("/:id/jobs", createJobLimiter, requireSelfOrAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const {
      title,
      description = null,
      category_id = null,
      area_text = null,
      hourly_or_fixed = "hourly",
      hourly_rate = null,
      fixed_price = null,
      start_time,
    } = req.body;

    if (!title || !start_time) {
      return res.status(400).json({ error: "title and start_time are required" });
    }

    if (!["hourly", "fixed"].includes(hourly_or_fixed)) {
      return res.status(400).json({
        error: "hourly_or_fixed must be 'hourly' or 'fixed'",
      });
    }

    if (hourly_or_fixed === "hourly" && !hourly_rate) {
      return res.status(400).json({
        error: "hourly_rate is required when hourly_or_fixed = 'hourly'",
      });
    }

    if (hourly_or_fixed === "fixed" && !fixed_price) {
      return res.status(400).json({
        error: "fixed_price is required when hourly_or_fixed = 'fixed'",
      });
    }

    // Check if client exists
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", clientId)
      .eq("role", "client")
      .single();

    if (clientError && clientError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (clientError) throw clientError;

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          client_id: clientId,
          category_id,
          title,
          description,
          area_text,
          hourly_or_fixed,
          hourly_rate,
          fixed_price,
          start_time,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Job created successfully",
      job: data,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /clients/:id/jobs - Get all client jobs
router.get("/:id/jobs", requireSelfOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (clientError && clientError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (clientError) throw clientError;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      client_id: id,
      jobs: data || [],
    });
  } catch (error) {
    console.error("Get client jobs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /clients/:id/jobs/:jobId - Update job
router.patch("/:id/jobs/:jobId", requireSelfOrAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const jobId = req.params.jobId;

    const {
      title,
      description,
      category_id,
      area_text,
      hourly_or_fixed,
      hourly_rate,
      fixed_price,
      start_time,
      end_time,
      status,
    } = req.body;

    // 1) Check if client exists
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", clientId)
      .eq("role", "client")
      .single();

    if (clientError && clientError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (clientError) throw clientError;

    // 2) Check if job exists AND belongs to this client
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("client_id", clientId)
      .single();

    if (jobError && jobError.code === "PGRST116") {
      return res.status(404).json({
        error: "Job not found or does not belong to this client",
      });
    }
    if (jobError) throw jobError;

    // 3) Build updates object
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;
    if (area_text !== undefined) updates.area_text = area_text;
    if (hourly_or_fixed !== undefined) updates.hourly_or_fixed = hourly_or_fixed;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    if (fixed_price !== undefined) updates.fixed_price = fixed_price;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    if (
      updates.hourly_or_fixed &&
      !["hourly", "fixed"].includes(updates.hourly_or_fixed)
    ) {
      return res.status(400).json({
        error: "hourly_or_fixed must be 'hourly' or 'fixed'",
      });
    }

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .eq("client_id", clientId)
      .select("*")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Job updated successfully",
      job: data,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /clients/:id/jobs/:jobId - Delete job
router.delete("/:id/jobs/:jobId", requireSelfOrAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const jobId = req.params.jobId;

    // Check if client exists
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", clientId)
      .eq("role", "client")
      .single();

    if (clientError && clientError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (clientError) throw clientError;

    // Check if job exists and belongs to this client
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("client_id", clientId)
      .single();

    if (jobError && jobError.code === "PGRST116") {
      return res.status(404).json({
        error: "Job not found or does not belong to this client",
      });
    }
    if (jobError) throw jobError;

    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Job deleted successfully",
      job_id: jobId,
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
