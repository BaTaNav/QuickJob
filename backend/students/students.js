const express = require("express");
const supabase = require("../supabaseClient");
const verifyJwt = require("../auth/verifyJwt");
const multer = require("multer");

// Configure Multer to store files in memory for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
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
    // Structured address
    street: row.street,
    house_number: row.house_number,
    postal_code: row.postal_code,
    city: row.city,
    hourly_or_fixed: row.hourly_or_fixed,
    hourly_rate: row.hourly_rate,
    fixed_price: row.fixed_price,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    created_at: row.created_at,
    image_url: row.image_url || null,
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
        message: "No job applications yet"
      });
    }

    const appliedJobIds = applications.map((app) => app.job_id);

    // Fetch jobs from applications
    let jobsQuery = supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text, street, house_number, postal_code, city,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, end_time, status, created_at, image_url,
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

      // Archive: completed or rejected or withdrawn
      if (appStatus === "completed" || appStatus === "rejected" || appStatus === "withdrawn") {
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

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, phone, role, created_at")
      .eq("id", studentId)
      .eq("role", "student")
      .single();

    if (userError?.code === 'PGRST116' || !userData) {
      return res.status(404).json({ error: "No student registered with this ID" });
    }
    if (userError) throw userError;

    // Fetch student profile data (include avatar_url if present)
    const { data: profileData, error: profileError } = await supabase
      .from("student_profiles")
      .select("school_name, field_of_study, academic_year, radius_km, verification_status, active_since, avatar_url")
      .eq("id", studentId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is okay for new users
      throw profileError;
    }

    // Combine user and profile data
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
 * Update student profile info (protected - JWT temporarily disabled)
 */
router.patch("/:studentId/profile", /* verifyJwt, */ async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // TODO: Verify the user is updating their own profile when JWT is enabled
    // if (req.user.id !== studentId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    const { phone, school_name, field_of_study, academic_year, radius_km } = req.body;

    // Update users table
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

    // Update student_profiles table
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
 * POST /students/:studentId/avatar
 * Upload or update a student's avatar image
 */
router.post("/:studentId/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const file = req.file;
    console.log(`Received student avatar upload for id=${studentId}`, { originalname: file?.originalname, size: file?.size, mimetype: file?.mimetype });
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `students/${studentId}/avatar-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage (create/use bucket 'avatars')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Student avatar uploaded to storage, publicUrl=`, publicUrl);

    // Update or insert into student_profiles
    const { data: existing, error: existingError } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', studentId)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('student_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', studentId);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('student_profiles')
        .insert([{ id: studentId, avatar_url: publicUrl }]);
      if (insertErr) throw insertErr;
    }

    res.status(200).json({ avatar_url: publicUrl });
  } catch (err) {
    console.error('Error uploading avatar for student:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * POST /students/:studentId/apply
 * Apply for a job (JWT temporarily disabled)
 */
router.post("/:studentId/apply", /* verifyJwt, */ async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { job_id, cover_letter } = req.body;

    // TODO: Verify the user is applying for themselves when JWT is enabled
    // if (req.user.id !== studentId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    // Validate inputs
    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from("job_applications")
      .select("id")
      .eq("student_id", studentId)
      .eq("job_id", job_id)
      .single();

    if (existingApp) {
      return res.status(409).json({ error: "Already applied to this job" });
    }

    // Ensure the job is open for applications
    const { data: jobRow, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status, start_time')
      .eq('id', job_id)
      .single();

    if (jobErr || !jobRow) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (jobRow.status !== 'open') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    // Create application
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
 * Get all applications for a student
 */
router.get("/:studentId/applications", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id, student_id, job_id, status, applied_at, overlap_confirmed,
        jobs (
          id, title, description, area_text, street, house_number, postal_code, city, hourly_rate, fixed_price, image_url,
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
      count: applications.length
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * PATCH /students/:studentId/applications/:applicationId
 * Update application status (only by student to cancel - JWT temporarily disabled)
 */
router.patch("/:studentId/applications/:applicationId", /* verifyJwt, */ async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const applicationId = parseInt(req.params.applicationId);
    const { status } = req.body;

    console.log(`[PATCH applications] studentId=${studentId}, applicationId=${applicationId}, status=${status}`);

    // Validate IDs
    if (isNaN(studentId) || isNaN(applicationId)) {
      console.error(`[PATCH applications] Invalid IDs: studentId=${studentId}, applicationId=${applicationId}`);
      return res.status(400).json({ error: "Invalid student ID or application ID" });
    }

    // TODO: Verify the user is updating their own application when JWT is enabled
    // if (req.user.id !== studentId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    // Only allow withdrawing applications (status: withdrawn)
    if (status !== "withdrawn") {
      return res.status(400).json({ error: "Only withdrawal is allowed from student side" });
    }

    // First check if application exists
    const { data: existingApp, error: checkError } = await supabase
      .from("job_applications")
      .select("id, student_id, status")
      .eq("id", applicationId)
      .single();

    if (checkError) {
      console.error(`[PATCH applications] Check error:`, checkError);
      return res.status(404).json({ error: "Application not found" });
    }

    if (!existingApp) {
      console.error(`[PATCH applications] Application not found: id=${applicationId}`);
      return res.status(404).json({ error: "Application not found" });
    }

    if (existingApp.student_id !== studentId) {
      console.error(`[PATCH applications] Student mismatch: expected=${studentId}, actual=${existingApp.student_id}`);
      return res.status(403).json({ error: "Not authorized to update this application" });
    }

    // Now update
    const { data, error } = await supabase
      .from("job_applications")
      .update({ status: "withdrawn" })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH applications] Update error:", error);
      throw error;
    }

    console.log("[PATCH applications] Successfully cancelled application:", data);
    res.json(data);
  } catch (err) {
    console.error("[PATCH applications] Unexpected error:", err);
    res.status(500).json({ error: "Failed to update application", details: err.message });
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
      .select("id, document_type, file_url, verified, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents = data || [];
    res.json({
      documents,
      message: documents.length === 0 ? "No documents uploaded yet" : null,
      count: documents.length
    });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * POST /students/:studentId/documents
 * Upload document for verification (JWT temporarily disabled)
 */
router.post("/:studentId/documents", /* verifyJwt, */ async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { document_type, file_url } = req.body;

    // TODO: Verify the user is uploading for themselves when JWT is enabled
    // if (req.user.id !== studentId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

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
 * Get reviews for a student from completed jobs
 */
router.get("/:studentId/reviews", async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const { data, error } = await supabase
      .from("job_reviews")
      .select(
        `
        id, rating, comment, created_at
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
    }));

    res.json({
      reviews,
      avg_rating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : null,
      message: reviews.length === 0 ? "No reviews yet" : null,
      count: reviews.length
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

module.exports = router;
