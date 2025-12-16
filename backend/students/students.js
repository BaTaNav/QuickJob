const express = require("express");
const supabase = require("../supabaseClient");
const verifyJwt = require("../auth/verifyJwt");
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
    location: row.location,
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
 * GET /students/:studentId/dashboard
 * Get the student dashboard with all job categories (today, upcoming, available, pending, archive)
 */
router.get("/:studentId/dashboard", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // Fetch all student's applications
    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select("id, job_id, status, created_at, updated_at")
      .eq("student_id", studentId);

    if (appError) throw appError;

    const appliedJobIds = applications.map((app) => app.job_id);

    // Fetch jobs from applications
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
      jobsQuery = jobsQuery.eq("id", -1); // Return no jobs if no applications
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

    // Categorize jobs
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);

    const today = [];
    const upcoming = [];
    const pending = [];
    const archive = [];

    for (const job of mappedJobs) {
      const startDateISO = job.start_time.slice(0, 10);
      const appStatus = job.application_status;

      // Archive: completed or rejected or cancelled
      if (appStatus === "completed" || appStatus === "rejected" || appStatus === "cancelled") {
        archive.push(job);
      }
      // Pending: awaiting response
      else if (appStatus === "pending") {
        pending.push(job);
      }
      // Today: starts today
      else if (startDateISO === todayISO && appStatus === "accepted") {
        today.push(job);
      }
      // Upcoming: future date and accepted
      else if (startDateISO > todayISO && appStatus === "accepted") {
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
 * Get student profile info
 */
router.get("/:studentId/profile", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("client_profiles")
      .select(
        `
        id, email, first_name, last_name, phone,
        role, avatar_url, created_at, updated_at,
        location, bio, hourly_rate, verified
      `
      )
      .eq("id", studentId)
      .eq("role", "student")
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Student not found" });

    res.json(data);
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PATCH /students/:studentId/profile
 * Update student profile info (protected)
 */
router.patch("/:studentId/profile", verifyJwt, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // Verify the user is updating their own profile
    if (req.user.id !== studentId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { first_name, last_name, phone, bio, location, hourly_rate, avatar_url } = req.body;

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (hourly_rate) updateData.hourly_rate = hourly_rate;
    if (avatar_url) updateData.avatar_url = avatar_url;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("client_profiles")
      .update(updateData)
      .eq("id", studentId)
      .eq("role", "student")
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Student not found" });

    res.json(data);
  } catch (err) {
    console.error("Error updating student profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /students/:studentId/apply
 * Apply for a job
 */
router.post("/:studentId/apply", verifyJwt, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { job_id, cover_letter } = req.body;

    // Verify the user is applying for themselves
    if (req.user.id !== studentId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate inputs
    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from("student_job_applications")
      .select("id")
      .eq("student_id", studentId)
      .eq("job_id", job_id)
      .single();

    if (existingApp) {
      return res.status(409).json({ error: "Already applied to this job" });
    }

    // Create application
    const { data, error } = await supabase
      .from("student_job_applications")
      .insert({
        student_id: studentId,
        job_id: job_id,
        status: "pending",
        cover_letter: cover_letter || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
 * Get all applications for a student
 */
router.get("/:studentId/applications", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("student_job_applications")
      .select(
        `
        id, student_id, job_id, status, cover_letter, created_at, updated_at,
        jobs (
          id, title, description, location, hourly_rate, fixed_price,
          start_time, status, job_categories (name_en, name_nl, name_fr)
        )
      `
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * PATCH /students/:studentId/applications/:applicationId
 * Update application status (only by student to cancel)
 */
router.patch("/:studentId/applications/:applicationId", verifyJwt, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const applicationId = parseInt(req.params.applicationId);
    const { status } = req.body;

    // Verify the user is updating their own application
    if (req.user.id !== studentId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Only allow cancelling applications (status: cancelled)
    if (status !== "cancelled") {
      return res.status(400).json({ error: "Only cancellation is allowed from student side" });
    }

    const { data, error } = await supabase
      .from("student_job_applications")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
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
 * Get documents uploaded by student for verification
 */
router.get("/:studentId/documents", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("student_documents")
      .select("id, document_type, file_url, verified, created_at, updated_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * POST /students/:studentId/documents
 * Upload document for verification (protected)
 */
router.post("/:studentId/documents", verifyJwt, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { document_type, file_url } = req.body;

    // Verify the user is uploading for themselves
    if (req.user.id !== studentId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

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
        updated_at: new Date().toISOString(),
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
 * Get reviews for a student from completed jobs
 */
router.get("/:studentId/reviews", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("job_reviews")
      .select(
        `
        id, rating, comment, created_at,
        profiles (first_name, last_name, avatar_url)
      `
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = data.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer: review.profiles,
    }));

    res.json({
      reviews,
      avg_rating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : null,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

module.exports = router;
