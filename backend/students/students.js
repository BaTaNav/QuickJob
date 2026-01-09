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
      // Defensive: start_time may be null/undefined for legacy rows — handle safely
      const startDateISO = job.start_time ? String(job.start_time).slice(0, 10) : null;
      const appStatus = job.application_status;

      // Archive: completed or rejected or withdrawn
      if (appStatus === "completed" || appStatus === "rejected" || appStatus === "withdrawn") {
        archive.push(job);
        continue;
      }

      // Pending: awaiting response
      if (appStatus === "pending") {
        pending.push(job);
        continue;
      }

      // Only consider accepted apps for today/upcoming buckets
      if (appStatus === 'accepted') {
        if (startDateISO && startDateISO === todayISO) {
          today.push(job);
          continue;
        }

        if (startDateISO && startDateISO > todayISO) {
          upcoming.push(job);
          continue;
        }
      }
      // Any other cases fall through (not included in lists)
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
    // Log full error including stack for easier debugging
    console.error("Error fetching student dashboard:", err && err.stack ? err.stack : err);
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
          start_time, end_time, status, job_categories (name_en, name_nl, name_fr)
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
      .from("reviews")
      .select(
        `
        id, rating, comment, created_at, client_id, job_id
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

/**
 * POST /students/reviews
 * Create a new review for a student
 * client_id comes from auth token (or temporary workaround: from body)
 * student_id is fetched from jobs table using job_id
 */
router.post("/reviews", async (req, res) => {
  try {
    const { job_id, rating, comment, client_id: clientIdFromBody } = req.body;

    // Validate required fields
    if (!job_id || !rating || !comment) {
      return res.status(400).json({ 
        error: "Missing required fields: job_id, rating, comment" 
      });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // TODO: Get client_id from auth token when JWT is implemented
    // For now, accept from body as temporary workaround
    const client_id = clientIdFromBody; // req.user.id when auth is ready

    if (!client_id) {
      return res.status(401).json({ error: "Client authentication required" });
    }

    // Fetch job to get student_id and verify client ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify the client owns this job
    if (job.client_id !== parseInt(client_id)) {
      return res.status(403).json({ error: "You can only review your own jobs" });
    }

    // Get the accepted applicant (student) for this job
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select("student_id")
      .eq("job_id", job_id)
      .eq("status", "accepted")
      .maybeSingle();

    if (appError || !application) {
      return res.status(400).json({ error: "No accepted student found for this job" });
    }

    const student_id = application.student_id;

    // Insert review into database
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        student_id: parseInt(student_id),
        client_id: parseInt(client_id),
        job_id: parseInt(job_id),
        rating: parseInt(rating),
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate review error
      if (error.code === '23505') {
        return res.status(409).json({ error: "You have already reviewed this job" });
      }
      console.error("Database error creating review:", error);
      return res.status(400).json({ error: error.message || "Database error" });
    }

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: err.message || "Failed to create review" });
  }
});

/**
 * GET /students/reviews/job/:jobId
 * Get all reviews for a specific job
 */
router.get("/reviews/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        student:users!reviews_student_id_fkey(id, email, first_name, last_name),
        client:users!reviews_client_id_fkey(id, email, first_name, last_name)
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching job reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json({ reviews: reviews || [] });
  } catch (err) {
    console.error("Error in GET /reviews/job/:jobId:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /students/reviews/student/:studentId
 * Get all reviews for a specific student with pagination
 */
router.get("/reviews/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        client:users!reviews_client_id_fkey(id, email, first_name, last_name),
        job:jobs(id, title)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching student reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json({ reviews: reviews || [] });
  } catch (err) {
    console.error("Error in GET /reviews/student/:studentId:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /students/reviews/client/:clientId
 * Get all reviews created by a specific client (optional - for client's own review history)
 */
router.get("/reviews/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        student:users!reviews_student_id_fkey(id, email, first_name, last_name),
        job:jobs(id, title)
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching client reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json({ reviews: reviews || [] });
  } catch (err) {
    console.error("Error in GET /reviews/client/:clientId:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /students/reviews/student/:studentId/summary
 * Get review summary for a student (average rating + count)
 */
router.get("/reviews/student/:studentId/summary", async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error fetching review summary:", error);
      return res.status(500).json({ error: "Failed to fetch review summary" });
    }

    const count = reviews?.length || 0;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    res.json({
      student_id: parseInt(studentId),
      average_rating: Math.round(average * 10) / 10, // Round to 1 decimal
      review_count: count,
    });
  } catch (err) {
    console.error("Error in GET /reviews/student/:studentId/summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /students/reviews/:id
 * Update a review (only by the client who created it)
 */
router.patch("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, client_id: clientIdFromBody } = req.body;

    // TODO: Get client_id from auth token when JWT is implemented
    const client_id = clientIdFromBody; // req.user.id when auth is ready

    if (!client_id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if review exists and belongs to this client
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (existingReview.client_id !== parseInt(client_id)) {
      return res.status(403).json({ error: "You can only update your own reviews" });
    }

    // Build update object
    const updates = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      updates.rating = parseInt(rating);
    }
    if (comment !== undefined) {
      updates.comment = comment.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating review:", updateError);
      return res.status(500).json({ error: "Failed to update review" });
    }

    res.json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (err) {
    console.error("Error in PATCH /reviews/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /students/reviews/:id
 * Delete a review (only by the client who created it)
 */
router.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id: clientIdFromBody } = req.body;

    // TODO: Get client_id from auth token when JWT is implemented
    const client_id = clientIdFromBody; // req.user.id when auth is ready

    if (!client_id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if review exists and belongs to this client
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (existingReview.client_id !== parseInt(client_id)) {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting review:", deleteError);
      return res.status(500).json({ error: "Failed to delete review" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /reviews/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
