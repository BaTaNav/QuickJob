const express = require("express");
const supabase = require("../supabaseClient");
const verifyJwt = require("../auth/verifyJwt");
const requireRole = require("../auth/requireRole");

// OPTIONAL (only if you already created middleware/rateLimiters.js)
// If you don't want rate limiting here, remove these 2 lines and the 2 middlewares below.
const { authLimiter, slowDownAuth } = require("../auth/rateLimiters");

const router = express.Router();

/**
 * Helper: Map job row to clean object
 */
function mapJobRow(row) {
  return {
    id: row.id,
    client_id: row.client_id,
    category_id: row.category_id,
    title: row.title,
    description: row.description,
    area_text: row.area_text,
    hourly_or_fixed: row.hourly_or_fixed,
    hourly_rate: row.hourly_rate,
    fixed_price: row.fixed_price,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    created_at: row.created_at,
    category: row.job_categories
      ? {
          id: row.job_categories.id,
          key: row.job_categories.key,
          name_nl: row.job_categories.name_nl,
          name_fr: row.job_categories.name_fr,
          name_en: row.job_categories.name_en,
        }
      : null,
  };
}

/**
 * ✅ Student can only access his own :studentId
 */
const requireStudentSelf = (req, res, next) => {
  if (!req.user?.sub) return res.status(401).json({ error: "Unauthorized" });

  // student can only use routes for his own id
  if (String(req.user.sub) !== String(req.params.studentId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

/* =========================
   PROTECTED ROUTES (ALL)
   ========================= */

// everything in this router requires token + student role
router.use(verifyJwt, requireRole("student"));

// OPTIONAL anti-spam (remove if you don’t want it)
router.use(slowDownAuth, authLimiter);

/**
 * GET /students/me
 */
router.get("/me", (req, res) => {
  res.json({ message: "student ok", user: req.user });
});

/**
 * GET /students/:studentId/dashboard
 * Get the student dashboard with all job categories (today, upcoming, available, pending, archive)
 */
router.get("/:studentId/dashboard", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select("id, job_id, status, applied_at")
      .eq("student_id", studentId);

    if (appError) throw appError;

    if (!applications || applications.length === 0) {
      return res.json({
        today: [],
        upcoming: [],
        pending: [],
        archive: [],
        counts: { today: 0, upcoming: 0, pending: 0, archive: 0 },
        message: "No job applications yet",
      });
    }

    const appliedJobIds = applications.map((app) => app.job_id);

    let jobsQuery = supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, end_time, status, created_at,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      );

    if (appliedJobIds.length > 0) {
      jobsQuery = jobsQuery.in("id", appliedJobIds);
    } else {
      jobsQuery = jobsQuery.eq("id", -1);
    }

    const { data: jobs, error: jobsError } = await jobsQuery.order("start_time", {
      ascending: true,
    });

    if (jobsError) throw jobsError;

    const mappedJobs = jobs.map((job) => {
      const application = applications.find((a) => a.job_id === job.id);
      return {
        ...mapJobRow(job),
        application_status: application?.status,
        application_id: application?.id,
      };
    });

    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);

    const today = [];
    const upcoming = [];
    const pending = [];
    const archive = [];

    for (const job of mappedJobs) {
      const startDateISO = job.start_time.slice(0, 10);
      const appStatus = job.application_status;

      if (appStatus === "completed" || appStatus === "rejected" || appStatus === "cancelled") {
        archive.push(job);
      } else if (appStatus === "pending") {
        pending.push(job);
      } else if (startDateISO === todayISO && appStatus === "accepted") {
        today.push(job);
      } else if (startDateISO > todayISO && appStatus === "accepted") {
        upcoming.push(job);
      }
    }

    res.json({
      today,
      upcoming,
      pending,
      archive,
      counts: {
        today: today.length,
        upcoming: upcoming.length,
        pending: pending.length,
        archive: archive.length,
      },
    });
  } catch (err) {
    console.error("Error fetching student dashboard:", err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

/**
 * GET /students/:studentId/profile
 */
router.get("/:studentId/profile", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, phone, role, created_at")
      .eq("id", studentId)
      .eq("role", "student")
      .single();

    if (userError?.code === "PGRST116" || !userData) {
      return res.status(404).json({ error: "No student registered with this ID" });
    }
    if (userError) throw userError;

    const { data: profileData, error: profileError } = await supabase
      .from("student_profiles")
      .select("school_name, field_of_study, academic_year, radius_km, verification_status, active_since")
      .eq("id", studentId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    const data = {
      ...userData,
      ...(profileData || {}),
    };

    res.json(data);
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PATCH /students/:studentId/profile
 * ✅ Now protected
 */
router.patch("/:studentId/profile", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { phone, school_name, field_of_study, academic_year, radius_km } = req.body;

    const userUpdateData = {};
    if (phone) userUpdateData.phone = phone;

    if (Object.keys(userUpdateData).length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .update(userUpdateData)
        .eq("id", studentId)
        .eq("role", "student");

      if (userError) throw userError;
    }

    const profileUpdateData = {};
    if (school_name) profileUpdateData.school_name = school_name;
    if (field_of_study) profileUpdateData.field_of_study = field_of_study;
    if (academic_year) profileUpdateData.academic_year = academic_year;
    if (radius_km !== undefined) profileUpdateData.radius_km = radius_km;

    let data = null;
    if (Object.keys(profileUpdateData).length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("student_profiles")
        .update(profileUpdateData)
        .eq("id", studentId)
        .select()
        .single();

      if (profileError) throw profileError;
      data = profileData;
    }

    res.json({ message: "Profile updated successfully", data });
  } catch (err) {
    console.error("Error updating student profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /students/:studentId/apply
 * ✅ Now protected
 */
router.post("/:studentId/apply", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { job_id, cover_letter } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    const { data: existingApp } = await supabase
      .from("job_applications")
      .select("id")
      .eq("student_id", studentId)
      .eq("job_id", job_id)
      .single();

    if (existingApp) {
      return res.status(409).json({ error: "Already applied to this job" });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        student_id: studentId,
        job_id: job_id,
        status: "pending",
        overlap_confirmed: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Error applying for job:", err);
    res.status(500).json({ error: "Failed to apply for job" });
  }
});

/**
 * GET /students/:studentId/applications
 */
router.get("/:studentId/applications", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id, student_id, job_id, status, applied_at, overlap_confirmed,
        jobs (
          id, title, description, area_text, hourly_rate, fixed_price,
          start_time, status, job_categories (name_en, name_nl, name_fr)
        )
      `
      )
      .eq("student_id", studentId)
      .order("applied_at", { ascending: false });

    if (error) throw error;

    const applications = data || [];
    res.json({
      applications,
      message: applications.length === 0 ? "No job applications yet" : null,
      count: applications.length,
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * PATCH /students/:studentId/applications/:applicationId
 * ✅ Now protected
 */
router.patch("/:studentId/applications/:applicationId", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const applicationId = parseInt(req.params.applicationId);
    const { status } = req.body;

    if (status !== "cancelled") {
      return res.status(400).json({ error: "Only cancellation is allowed from student side" });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update({ status: "cancelled" })
      .eq("id", applicationId)
      .eq("student_id", studentId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Application not found" });

    res.json(data);
  } catch (err) {
    console.error("Error updating application:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

/**
 * GET /students/:studentId/documents
 */
router.get("/:studentId/documents", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("student_documents")
      .select("id, document_type, file_url, verified, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents = data || [];
    res.json({
      documents,
      message: documents.length === 0 ? "No documents uploaded yet" : null,
      count: documents.length,
    });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * POST /students/:studentId/documents
 * ✅ Now protected
 */
router.post("/:studentId/documents", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { document_type, file_url } = req.body;

    if (!document_type || !file_url) {
      return res.status(400).json({ error: "document_type and file_url are required" });
    }

    const { data, error } = await supabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        document_type,
        file_url,
        verified: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Error uploading document:", err);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

/**
 * GET /students/:studentId/reviews
 */
router.get("/:studentId/reviews", requireStudentSelf, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("job_reviews")
      .select(`id, rating, comment, created_at`)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = (data || []).map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    }));

    res.json({
      reviews,
      avg_rating:
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
          : null,
      message: reviews.length === 0 ? "No reviews yet" : null,
      count: reviews.length,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

module.exports = router;
