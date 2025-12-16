const express = require("express");
const bcrypt = require("bcrypt");
const supabase = require("../supabaseClient");

const router = express.Router();

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

    const allowedLangs = ["nl", "fr", "en"];
    const lang = allowedLangs.includes(preferred_language)
      ? preferred_language
      : "nl";

    // Check if email already exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email);

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
          email,
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

// POST /clients/login - Login client
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email en password zijn verplicht." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, password_hash, role, phone, preferred_language, two_factor_enabled, created_at"
      )
      .eq("email", email)
      .eq("role", "client")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(401).json({ message: "Ongeldige email of password." });
    }
    if (error) {
      console.error("Login select error:", error);
      return res
        .status(500)
        .json({ message: "Interne serverfout.", supabaseError: error });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Ongeldige email of password." });
    }

    return res.status(200).json({
      message: "Succesvol ingelogd.",
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


// GET /clients/:id - Get one client
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (error) throw error;

    res.status(200).json({ client: data });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /clients/:id - Update client profile
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, phone, preferred_language, two_factor_enabled } = req.body;

    // Check if client exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (existingError) throw existingError;

    // Build updates object
    const updates = {};
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (preferred_language) updates.preferred_language = preferred_language;
    if (two_factor_enabled !== undefined) updates.two_factor_enabled = two_factor_enabled;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .eq("role", "client")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Client updated successfully",
      client: data,
    });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /clients/:id - Delete client
router.delete("/:id", async (req, res) => {
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

// POST /clients/:id/jobs - Create job
// POST /clients/:id/jobs - Create job
router.post("/:id/jobs", async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const {
      title,
      description = null,
      category_id = null,
      area_text = null,
      hourly_or_fixed = "hourly", // 'hourly' of 'fixed'
      hourly_rate = null,
      fixed_price = null,
      start_time,
    } = req.body;

    // Validate required fields
    if (!title || !start_time) {
      return res
        .status(400)
        .json({ error: "title and start_time are required" });
    }

    // Validate hourly_or_fixed
    if (!["hourly", "fixed"].includes(hourly_or_fixed)) {
      return res
        .status(400)
        .json({ error: "hourly_or_fixed must be 'hourly' or 'fixed'" });
    }

    // Extra validaties per type
    if (hourly_or_fixed === "hourly" && !hourly_rate) {
      return res
        .status(400)
        .json({ error: "hourly_rate is required when hourly_or_fixed = 'hourly'" });
    }

    if (hourly_or_fixed === "fixed" && !fixed_price) {
      return res
        .status(400)
        .json({ error: "fixed_price is required when hourly_or_fixed = 'fixed'" });
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

    // Insert job — LET OP: alleen bestaande kolommen gebruiken!
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
          // end_time laten we null → student registreert werkelijke tijd
          // status default = 'open'
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
router.get("/:id/jobs", async (req, res) => {
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

    // Get all jobs for this client
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
router.patch("/:id/jobs/:jobId", async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const jobId = Number(req.params.jobId);

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

    if (Number.isNaN(clientId) || Number.isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid client or job id" });
    }

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
      return res
        .status(404)
        .json({ error: "Job not found or does not belong to this client" });
    }
    if (jobError) throw jobError;

    // 3) Build updates object — alleen bestaande kolommen
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

    // Extra: validate hourly_or_fixed value if provided
    if (
      updates.hourly_or_fixed &&
      !["hourly", "fixed"].includes(updates.hourly_or_fixed)
    ) {
      return res
        .status(400)
        .json({ error: "hourly_or_fixed must be 'hourly' or 'fixed'" });
    }

    // 4) Update job
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
router.delete("/:id/jobs/:jobId", async (req, res) => {
  try {
    const { id, jobId } = req.params;

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

    // Check if job exists and belongs to this client
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("client_id", id)
      .single();

    if (jobError && jobError.code === "PGRST116") {
      return res.status(404).json({ error: "Job not found or does not belong to this client" });
    }
    if (jobError) throw jobError;

    // Delete job
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("client_id", id)
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