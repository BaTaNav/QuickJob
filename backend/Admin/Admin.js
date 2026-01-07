const express = require("express");
const bcrypt = require("bcrypt");
const supabase = require("../supabaseClient");

const router = express.Router();


// POST /admin/login - Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email en password zijn verplicht." });
    }

    console.log("🔍 Admin login attempt:", email);

    // Fetch admin user
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id, email, password_hash, role, phone,
        preferred_language, two_factor_enabled, created_at
      `)
      .eq("email", email.trim().toLowerCase())
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error while fetching admin:", error);
      return res.status(500).json({ message: "Interne serverfout." });
    }

    // User not found
    if (!user) {
      console.warn("⚠️ Admin not found:", email);
      return res.status(401).json({ message: "Ongeldige admin credentials." });
    }

    if (!user.password_hash) {
      console.error("❌ Admin record heeft GEEN password_hash:", user);
      return res.status(500).json({ message: "Admin account verkeerd geconfigureerd." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.warn("⚠️ Verkeerd wachtwoord voor admin:", email);
      return res.status(401).json({ message: "Ongeldige admin credentials." });
    }

    console.log("✔️ Admin login success:", email);

    // SUCCESS RESPONSE
    return res.status(200).json({
      message: "Admin succesvol ingelogd.",
      admin: {
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
    console.error("🔥 Admin login server error:", err);
    return res.status(500).json({ message: "Interne serverfout." });
  }
});
// ==================== USER MANAGEMENT ====================

// GET /admin/users - Get all users
router.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      total: data.length,
      users: data 
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/users/:id - Get one user
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

// PATCH /admin/users/:id - Update user
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, phone, preferred_language, two_factor_enabled } = req.body;

    // Check if user exists
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "User niet gevonden." });
    }
    if (existingError) throw existingError;

    // Build updates
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

// DELETE /admin/users/:id - Delete user
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

// PATCH /admin/users/:id/role - Change user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["student", "client", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ 
        error: "Ongeldige role. Kies uit: student, client, admin" 
      });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, email, role, created_at")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "User niet gevonden." });
    }
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

// ==================== STUDENT MANAGEMENT ====================

// GET /admin/students - Get all students
router.get("/students", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      total: data.length,
      students: data 
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/students/:id - Get one student
router.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("id", id)
      .eq("role", "student")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Student niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({ student: data });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/students/:id - Update student
router.patch("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, phone, preferred_language, two_factor_enabled } = req.body;

    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "student")
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "Student niet gevonden." });
    }
    if (existingError) throw existingError;

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
      return res.status(400).json({ error: "Geen velden om te updaten." });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .eq("role", "student")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Student succesvol geüpdatet.",
      student: data,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/students/:id - Delete student
router.delete("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "student")
      .select("id, email")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Student niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: "Student succesvol verwijderd.",
      deleted_student: data,
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLIENT MANAGEMENT ====================

// GET /admin/clients - Get all clients
router.get("/clients", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      total: data.length,
      clients: data 
    });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/clients/:id - Get one client
router.get("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, two_factor_enabled, created_at")
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Client niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({ client: data });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/clients/:id - Update client
router.patch("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, phone, preferred_language, two_factor_enabled } = req.body;

    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "client")
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "Client niet gevonden." });
    }
    if (existingError) throw existingError;

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
      return res.status(400).json({ error: "Geen velden om te updaten." });
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
      message: "Client succesvol geüpdatet.",
      client: data,
    });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/clients/:id - Delete client
router.delete("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "client")
      .select("id, email")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Client niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: "Client succesvol verwijderd.",
      deleted_client: data,
    });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== JOB MANAGEMENT ====================

// GET /admin/jobs - Get all jobs
router.get("/jobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        client:users!client_id(id, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      total: data.length,
      jobs: data 
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/jobs/:id - Get one job
router.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        client:users!client_id(id, email, phone)
      `)
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Job niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({ job: data });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/jobs/:id - Update job
router.patch("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, salary, requirements, status } = req.body;

    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", id)
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "Job niet gevonden." });
    }
    if (existingError) throw existingError;

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (salary !== undefined) updates.salary = salary;
    if (requirements !== undefined) updates.requirements = requirements;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Geen velden om te updaten." });
    }

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Job succesvol geüpdatet.",
      job: data,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/jobs/:id - Delete job
router.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .select("id, title")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Job niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: "Job succesvol verwijderd.",
      deleted_job: data,
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/jobs/:id/status - Approve/Reject job
router.patch("/jobs/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected", "closed"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Ongeldige status. Kies uit: pending, approved, rejected, closed" 
      });
    }

    const { data, error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Job niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: `Job status gewijzigd naar ${status}.`,
      job: data,
    });
  } catch (error) {
    console.error("Update job status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPLICATION MANAGEMENT ====================

// ==================== APPLICATION MANAGEMENT ====================

// GET /admin/applications - Get all applications
router.get("/applications", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        job_id,
        student_id,
        status,
        applied_at,
        overlap_confirmed,
        student:users!fk_app_student ( id, email, phone ),
        job:jobs!fk_app_job ( id, title, client_id )
      `)
      .order("applied_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      total: data.length,
      applications: data,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/applications/:id - Get one application
router.get("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        job_id,
        student_id,
        status,
        applied_at,
        overlap_confirmed,
        student:users!fk_app_student ( id, email, phone ),
        job:jobs!fk_app_job ( id, title, client_id )
      `)
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Application niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({ application: data });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/applications/:id - Update application
router.patch("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, overlap_confirmed } = req.body;

    // Optional: validate status against CHECK constraint
    const allowedStatuses = ["pending", "accepted", "rejected", "withdrawn"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Ongeldige status. Kies uit: pending, accepted, rejected, withdrawn",
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("id", id)
      .single();

    if (existingError && existingError.code === "PGRST116") {
      return res.status(404).json({ error: "Application niet gevonden." });
    }
    if (existingError) throw existingError;

    const updates = {};
    if (status) updates.status = status;
    if (overlap_confirmed !== undefined) updates.overlap_confirmed = overlap_confirmed;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Geen velden om te updaten." });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Application succesvol geüpdatet.",
      application: data,
    });
  } catch (error) {
    console.error("Update application error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/applications/:id - Delete application
router.delete("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Application niet gevonden." });
    }
    if (error) throw error;

    res.status(200).json({
      message: "Application succesvol verwijderd.",
      deleted_application_id: id,
    });
  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;