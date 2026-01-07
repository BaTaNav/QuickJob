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

    // Haal de basis users info op
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, role, phone, preferred_language, created_at")
      .eq("id", id)
      .single();

    if (userError && userError.code === "PGRST116") {
      return res.status(404).json({ error: "Gebruiker niet gevonden." });
    }
    if (userError) throw userError;

    let profileData = null;

    // Haal extra profielinfo op afhankelijk van de rol
    if (user.role === 'student') {
        // CORRECTIE: tabelnaam is student_profiles
        const { data: student, error: studentError } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("id", id) 
            .single();
        if (!studentError) profileData = student;
    } else if (user.role === 'client') {
        const { data: client, error: clientError } = await supabase
            .from("clients")
            .select("*")
            .eq("id", id)
            .single();
        if (!clientError) profileData = client;
    }

    res.status(200).json({ user, profile: profileData });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STUDENT VERIFICATION ====================

// GET /admin/students/pending
router.get("/students/pending", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select(`
        *,
        user:users!id (email, phone, created_at)
      `)
      .eq("verification_status", "pending");
      // .order("created_at", { ascending: false }); // VERWIJDERD: kolom bestaat niet

    if (error) throw error;

    // Sorteer in JavaScript op user.created_at als backup
    const students = data.map(s => ({
        ...s,
        email: s.user?.email,
        phone: s.user?.phone || s.phone,
        created_at: s.user?.created_at
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({ 
      count: students.length,
      students: students 
    });
  } catch (error) {
    console.error("Get pending students error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/students/verified
router.get("/students/verified", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select(`
        *,
        user:users!id (email, phone, created_at)
      `)
      .eq("verification_status", "verified")
      .limit(50); 
      // .order("created_at", { ascending: false }); // VERWIJDERD

    if (error) throw error;

    const students = data.map(s => ({
        ...s,
        email: s.user?.email,
        phone: s.user?.phone || s.phone,
        created_at: s.user?.created_at
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));;

    res.status(200).json({ 
      count: students.length,
      students: students 
    });
  } catch (error) {
    console.error("Get verified students error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /admin/students/:id/verify
router.patch("/students/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Use 'verified' or 'rejected'" });
    }

    // Update status (zonder admin_comments)
    const { data, error } = await supabase
      .from("student_profiles")
      .update({ 
          verification_status: status
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.status(200).json({ 
      message: `Student successfully ${status}`,
      student: data 
    });
  } catch (error) {
    console.error("Verify student error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== JOBS MANAGEMENT ====================

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