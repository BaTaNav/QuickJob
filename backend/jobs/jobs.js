const express = require("express");
const supabase = require("../supabaseClient");
const router = express.Router();

// Multer (optional): use try/catch so the server can still start when multer
// is not installed (helps development). If missing, the /jobs/upload-image
// route will return 501 with a helpful message.
let multer;
let upload = null;
try {
  multer = require("multer");
  // Configure Multer to store files in memory
  const storage = multer.memoryStorage();
  upload = multer({ storage: storage });
} catch (e) {
  // multer is optional for local development; log a clear message.
  console.warn('Multer is not installed. Image upload endpoint will be disabled. To enable, run `npm install multer` in the backend folder.');
}

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
  // Optional geocoded coordinates (may be null until DB columns are added/backfilled)
  latitude: row.latitude || null,
  longitude: row.longitude || null,
    start_time: row.start_time,
    status: row.status,
    created_at: row.created_at,
    image_url: row.image_url, 
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
 * POST /jobs/upload-image
 * Uploads an image file to Supabase Storage (Bucket: 'job-images')
 */
/**
 * POST /jobs/upload-image
 * Uploads an image file to Supabase Storage (Bucket: 'job-images')
 */
if (upload) {
  router.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("Attempting to upload:", file.originalname); // Log 1

      // 1. Generate a unique filename
      const fileExt = file.originalname.split(".").pop();
      const fileName = `job-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("job-images") // <--- MUST MATCH YOUR SUPABASE BUCKET NAME
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage Error:", error); // Log 2: Print actual error to terminal
        throw error;
      }

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("job-images")
        .getPublicUrl(filePath);

      console.log("Upload success, URL:", publicUrlData.publicUrl); // Log 3

      res.status(200).json({ url: publicUrlData.publicUrl });
    } catch (error) {
      console.error("Server Upload Error:", error.message);
      // Send the ACTUAL error message to the frontend
      res.status(500).json({ error: error.message, details: error });
    }
  });
} else {
  router.post("/upload-image", async (req, res) => {
    res.status(501).json({ error: 'Image upload disabled on server. Install multer in backend: npm install multer' });
  });
}

/**
 * Geocode a free-text or composed address using Nominatim (OpenStreetMap).
 * Returns { latitude, longitude } or null on failure.
 * NOTE: For production use, respect Nominatim usage policy and consider a paid geocoding service.
 */
async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const q = encodeURIComponent(address + ', Belgium');
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0&countrycodes=be`;
    // Log the geocoding request for debugging (remove or reduce verbosity in production)
    console.log('Geocoding request URL:', url);
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a valid User-Agent or Referer identifying the application
        'User-Agent': 'QuickJob/1.0 (contact@quickjob.be)'
      }
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    const first = j[0];
    console.log('Geocoding result:', first);
    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return null;
  }
}

/**
 * GET /jobs/geocode?address=...
 * Simple wrapper around geocodeAddress to support frontend address-based mapping.
 */
router.get('/geocode', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address || String(address).trim() === '') {
      return res.status(400).json({ error: 'Missing address query parameter' });
    }

    const geo = await geocodeAddress(String(address));
    if (!geo) {
      return res.status(404).json({ error: 'No geocoding result' });
    }
    res.json(geo);
  } catch (err) {
    console.error('Error in /jobs/geocode:', err);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

/**
 * GET /jobs/available
 * Get all available jobs (not filtered by location yet)
 * Optional query: ?status=open&limit=20&studentId=123
 * If studentId is provided, excludes jobs the student has already applied to
 */
router.get("/available", async (req, res) => {
  try {
    const status = req.query.status || "open";
    const limit = parseInt(req.query.limit) || 50;
    const studentId = req.query.studentId ? parseInt(req.query.studentId) : null;

    // If studentId provided, get job IDs the student has ACTIVE applications for (pending/accepted)
    // Withdrawn/rejected applications should NOT exclude the job from available
    let excludeJobIds = [];
    if (studentId) {
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("student_id", studentId)
        .in("status", ["pending", "accepted"]); // Only exclude active applications
      
      if (appError) {
        console.error("Error fetching student applications:", appError);
      } else if (applications && applications.length > 0) {
        excludeJobIds = applications.map(app => app.job_id);
      }
    }

    let query = supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text, street, house_number, postal_code, city, latitude, longitude,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at, image_url,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("status", status)
      // Exclude jobs that are already in the past so students can't apply to them
      .gt('start_time', new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(limit);

    // Exclude jobs the student has already applied to
    if (excludeJobIds.length > 0) {
      query = query.not("id", "in", `(${excludeJobIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const jobs = data?.map(mapJobRow) || [];
    res.json({
      jobs,
      message: jobs.length === 0 ? "No jobs available at the moment" : null,
      count: jobs.length,
    });
  } catch (err) {
    console.error("Error fetching available jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/**
 * GET /jobs/search?q=term&location=city&category=cat_id
 * Search jobs by title, description, location
 */
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q || "";
    const location = req.query.location || "";
    const categoryId = req.query.category;

    let query = supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
  title, description, area_text, street, house_number, postal_code, city,
        latitude, longitude,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at, image_url,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("status", "open");

    // Add filters
    if (searchTerm) {
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }
    if (location) {
      // Match location against city OR area_text for backward compatibility
      query = query.or(`city.ilike.%${location}%,area_text.ilike.%${location}%`);
    }
    if (categoryId) {
      query = query.eq("category_id", parseInt(categoryId));
    }

    const { data, error } = await query
      .order("start_time", { ascending: true })
      .limit(100);

    if (error) throw error;

    const jobs = data?.map(mapJobRow) || [];
    res.json({
      jobs,
      message: jobs.length === 0 ? "No jobs match your search criteria" : null,
      count: jobs.length,
    });
  } catch (err) {
    console.error("Error searching jobs:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * POST /jobs
 * Create a new job
 */
router.post("/", async (req, res) => {
  try {
    const {
      client_id,
      category_id,
      title,
      description,
      area_text,
      street,
      house_number,
      postal_code,
      city,
      hourly_or_fixed,
      hourly_rate,
      fixed_price,
      start_time,
      image_url,
    } = req.body;

    const clientIdNum = parseInt(client_id, 10);
    const categoryIdNum = parseInt(category_id, 10);

    // Validate required fields
    if (!clientIdNum || !categoryIdNum || !title || !start_time) {
      return res.status(400).json({
        error:
          "Missing required fields: client_id, category_id, title, start_time",
      });
    }

    // Require structured address fields (at least one) instead of relying solely on area_text.
    const hasStructuredAddress = (street && String(street).trim() !== '') ||
      (house_number && String(house_number).trim() !== '') ||
      (postal_code && String(postal_code).trim() !== '') ||
      (city && String(city).trim() !== '');

    if (!hasStructuredAddress) {
      return res.status(400).json({
        error: "Missing structured address. Please provide at least one of: street, house_number, postal_code or city.",
      });
    }

    // If area_text is not provided, compose a best-effort area_text from structured fields for backward compatibility
    const composedAreaText = area_text && String(area_text).trim() !== ''
      ? area_text
      : [street, house_number, postal_code, city].filter(Boolean).join(' ').trim() || null;

    // Validate hourly_or_fixed and corresponding price
    if (hourly_or_fixed === "fixed" && !fixed_price) {
      return res
        .status(400)
        .json({ error: "Fixed price required for fixed jobs" });
    }

    // Validate start_time is at least 2 hours in the future
    if (!start_time) {
      return res.status(400).json({ error: 'start_time is required and must be an ISO timestamp at least 2 hours in the future' });
    }
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'start_time is not a valid date' });
    }
    const now = new Date();
    const minAllowed = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (startDate.getTime() < minAllowed.getTime()) {
      return res.status(400).json({ error: 'start_time must be at least 2 hours in the future' });
    }

  // Insert job
  // Attempt geocoding of the composed address (best-effort)
  console.log('Composed area_text for geocoding:', composedAreaText);
  const geo = await geocodeAddress(composedAreaText);

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: clientIdNum,
        category_id: categoryIdNum,
        title,
        description: description || null,
        area_text: composedAreaText,
        street: street || null,
        house_number: house_number || null,
        postal_code: postal_code || null,
        city: city || null,
        latitude: geo ? geo.latitude : null,
        longitude: geo ? geo.longitude : null,
        hourly_or_fixed,
        hourly_rate: hourly_rate || null,
        fixed_price: fixed_price || null,
        start_time,
        status: "open",
        created_at: new Date().toISOString(),
        image_url: image_url || null, // Save image URL
      })
      .select()
      .single();

    if (jobError) throw jobError;

    const mapped = mapJobRow(job);
    res.status(201).json({
      message: "Job created successfully",
      job: mapped,
    });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

/**
 * Background expiry runner
 * - Finds open jobs that start within the next 30 minutes
 * - If a job has ZERO applicants, mark it completed and flag as expired (best-effort)
 * Implementation notes:
 * - We first attempt to update with `expired` and `closed_at` fields; if those columns don't exist
 *   the update call may return an error. In that case we fallback to updating only the `status`.
 * - This runner is intended for local/dev usage. For production consider running as a single
 *   cron job or scheduled task to avoid duplicate workers across multiple instances.
 */
async function runExpirySweep() {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // now + 30min

    console.log('[ExpiryRunner] scanning for open jobs starting before', threshold);

     const { data: jobsToCheck, error: jobsError } = await supabase
      .from('jobs')
      .select('id, start_time')
      .eq('status', 'open')
      .lte('start_time', threshold)
      .limit(200);

    if (jobsError) {
      console.error('[ExpiryRunner] error querying jobs:', jobsError);
      return;
    }

    if (!jobsToCheck || jobsToCheck.length === 0) {
      // nothing to do
      return;
    }

    for (const job of jobsToCheck) {
      try {
        // Check if any applications exist for this job
        const { count, error: appCountError } = await supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .eq('job_id', job.id);

        if (appCountError) {
          console.warn('[ExpiryRunner] failed to get applications count for job', job.id, appCountError);
          continue;
        }

        if (Number(count) > 0) {
          // job has applicants; skip
          continue;
        }

        // Mark job as expired (set status = 'expired')
        try {
          const resp = await supabase
            .from('jobs')
            .update({ status: 'expired' })
            .eq('id', job.id)
            .select()
            .single();
          if (resp.error) {
            console.error('[ExpiryRunner] failed to mark job expired', job.id, resp.error);
          } else {
            console.log('[ExpiryRunner] marked job expired id=', job.id);
          }
        } catch (e) {
          console.error('[ExpiryRunner] unexpected error updating job', job.id, e);
        }
      } catch (innerErr) {
        console.error('[ExpiryRunner] error processing job', job.id, innerErr);
      }
    }
  } catch (err) {
    console.error('[ExpiryRunner] top-level error:', err);
  }
}

// Run the expiry sweep immediately and then every 60 seconds.
// Note: in multi-instance deployments consider moving this to a single scheduled worker.
runExpirySweep().catch((e) => console.error('[ExpiryRunner] initial run failed:', e));
setInterval(() => runExpirySweep().catch((e) => console.error('[ExpiryRunner] interval run failed:', e)), 60 * 1000);

/**
 * POST /jobs/draft
 * Save a draft job (status=draft)
 */
// POST /jobs/draft - Save a draft job (status=draft)
router.post("/draft", async (req, res) => {
  try {
    const {
      client_id,
      category_id,
      title,
      description,
      area_text,
      street,
      house_number,
      postal_code,
      city,
      hourly_or_fixed,
      hourly_rate,
      fixed_price,
      start_time,
      image_url,
    } = req.body;

    const clientIdNum = parseInt(client_id, 10);
    const categoryIdNum = parseInt(category_id, 10);

    // Minimal validation for drafts
    if (!clientIdNum || !categoryIdNum || !title || !start_time) {
      return res.status(400).json({
        error: "Missing required fields: client_id, category_id, title, start_time",
      });
    }

    // For drafts, also encourage structured address. If none provided, reject to enforce the new pattern.
    const hasStructuredAddress = (street && String(street).trim() !== '') ||
      (house_number && String(house_number).trim() !== '') ||
      (postal_code && String(postal_code).trim() !== '') ||
      (city && String(city).trim() !== '');

    if (!hasStructuredAddress) {
      return res.status(400).json({
        error: "Missing structured address for draft. Please provide at least one of: street, house_number, postal_code or city.",
      });
    }

    // Compose area_text from structured fields if not explicitly provided
    const composedAreaText = area_text && String(area_text).trim() !== ''
      ? area_text
      : [street, house_number, postal_code, city].filter(Boolean).join(' ').trim() || null;

    // Attempt geocoding for draft as well (best-effort)
    // Validate start_time for drafts as well: at least 2 hours ahead
    const startDateDraft = new Date(start_time);
    if (isNaN(startDateDraft.getTime())) {
      return res.status(400).json({ error: 'start_time is not a valid date' });
    }
    const nowDraft = new Date();
    const minAllowedDraft = new Date(nowDraft.getTime() + 2 * 60 * 60 * 1000);
    if (startDateDraft.getTime() < minAllowedDraft.getTime()) {
      return res.status(400).json({ error: 'start_time must be at least 2 hours in the future for drafts' });
    }

    const geoDraft = await geocodeAddress(composedAreaText);

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: clientIdNum,
        category_id: categoryIdNum,
        title,
        description: description || null,
        area_text: composedAreaText,
        street: street || null,
        house_number: house_number || null,
        postal_code: postal_code || null,
        city: city || null,
        latitude: geoDraft ? geoDraft.latitude : null,
        longitude: geoDraft ? geoDraft.longitude : null,
        hourly_or_fixed,
        hourly_rate: hourly_rate || null,
        fixed_price: fixed_price || null,
        start_time,
        status: "draft",
        created_at: new Date().toISOString(),
        image_url: image_url || null,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    const mapped = mapJobRow(job);
    res.status(201).json({
      message: "Job created successfully",
      job: mapped,
    });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

/**
 * GET /jobs/client/:clientId
 * Get all jobs for a specific client
 * Optional query: ?status=open
 */
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId, 10);
    const status = req.query.status;

    if (!clientId) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    let query = supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text,
        street, house_number, postal_code, city, latitude, longitude,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at, image_url,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Get applicant counts for each job
    const jobIds = data?.map(job => job.id) || [];
    let applicantCounts = {};
    
    if (jobIds.length > 0) {
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("job_id, status")
        .in("job_id", jobIds)
        .in("status", ["pending", "accepted"]); // Only count active applications
      
      if (!appError && applications) {
        applications.forEach(app => {
          if (!applicantCounts[app.job_id]) {
            applicantCounts[app.job_id] = { pending: 0, accepted: 0 };
          }
          applicantCounts[app.job_id][app.status]++;
        });
      }
    }

    // Additionally fetch accepted application details (one per job) so the client
    // Planned tab can show the accepted student info without extra queries.
    let acceptedMap = {};
    if (jobIds.length > 0) {
      const { data: acceptedApps, error: accErr } = await supabase
        .from('job_applications')
        .select('id, job_id, student_id, status, applied_at')
        .in('job_id', jobIds)
        .eq('status', 'accepted');

      if (!accErr && acceptedApps && acceptedApps.length > 0) {
        const studentIds = [...new Set(acceptedApps.map(a => a.student_id))];

        // Fetch student profiles and user contact info
        const { data: profiles, error: profileErr } = await supabase
          .from('student_profiles')
          .select('id, school_name, field_of_study, academic_year, avatar_url, verification_status')
          .in('id', studentIds);

        const { data: users, error: userErr } = await supabase
          .from('users')
          .select('id, email, phone')
          .in('id', studentIds);

        const profileMap = {};
        const userMap = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });
        users?.forEach(u => { userMap[u.id] = u; });

        acceptedApps.forEach(a => {
          acceptedMap[a.job_id] = {
            application_id: a.id,
            student_id: a.student_id,
            applied_at: a.applied_at,
            student: {
              id: a.student_id,
              email: userMap[a.student_id]?.email,
              phone: userMap[a.student_id]?.phone,
              school_name: profileMap[a.student_id]?.school_name,
              field_of_study: profileMap[a.student_id]?.field_of_study,
              academic_year: profileMap[a.student_id]?.academic_year,
              avatar_url: profileMap[a.student_id]?.avatar_url,
              verification_status: profileMap[a.student_id]?.verification_status,
            }
          };
        });
      }
    }

    const jobs = data?.map(job => ({
      ...mapJobRow(job),
      applicant_count: (applicantCounts[job.id]?.pending || 0) + (applicantCounts[job.id]?.accepted || 0),
      pending_applicants: applicantCounts[job.id]?.pending || 0,
      accepted_applicants: applicantCounts[job.id]?.accepted || 0,
      accepted_applicant: acceptedMap[job.id] || null,
    })) || [];

    res.json({
      jobs,
      message: jobs.length === 0 ? "No jobs found for this client" : null,
      count: jobs.length,
    });
  } catch (err) {
    console.error("Error fetching client jobs:", err);
    res.status(500).json({ error: "Failed to fetch client jobs" });
  }
});

/**
 * GET /jobs/:jobId/applicants
 * Get all applicants for a specific job (for client to view)
 */
router.get("/:jobId/applicants", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);

    if (!jobId) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // Get the job to verify it exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, client_id, title")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Get all applications for this job
    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select("id, status, applied_at, student_id")
      .eq("job_id", jobId)
      .in("status", ["pending", "accepted"])
      .order("applied_at", { ascending: false });

    if (appError) throw appError;

    // For each application, fetch the student profile and user info
    let applicants = [];
    if (applications && applications.length > 0) {
      const studentIds = applications.map(app => app.student_id);
      
      // Fetch all student profiles
      const { data: profiles, error: profileError } = await supabase
        .from("student_profiles")
        .select("id, school_name, field_of_study, academic_year, avatar_url, verification_status")
        .in("id", studentIds);

      if (profileError) throw profileError;

      // Fetch all users
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, email, phone")
        .in("id", studentIds);

      if (userError) throw userError;

      // Create lookup maps
      const profileMap = {};
      const userMap = {};
      
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      
      users?.forEach(user => {
        userMap[user.id] = user;
      });

      // Build applicant list
      applicants = applications.map(app => ({
        application_id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        student: {
          id: app.student_id,
          email: userMap[app.student_id]?.email,
          phone: userMap[app.student_id]?.phone,
          school_name: profileMap[app.student_id]?.school_name,
          field_of_study: profileMap[app.student_id]?.field_of_study,
          academic_year: profileMap[app.student_id]?.academic_year,
          avatar_url: profileMap[app.student_id]?.avatar_url,
          verification_status: profileMap[app.student_id]?.verification_status,
        }
      }));
    }

    res.json({
      job_id: jobId,
      job_title: job.title,
      applicants,
      count: applicants.length,
    });
  } catch (err) {
    console.error("Error fetching applicants:", err);
    res.status(500).json({ error: "Failed to fetch applicants" });
  }
});

/**
 * PATCH /jobs/:jobId/applicants/:applicationId
 * Accept or reject an applicant
 */
router.patch("/:jobId/applicants/:applicationId", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const applicationId = parseInt(req.params.applicationId, 10);
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!jobId || !applicationId) {
      return res.status(400).json({ error: "Invalid job or application ID" });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
    }

    // Verify the application exists and belongs to this job
    const { data: existingApp, error: fetchError } = await supabase
      .from("job_applications")
      .select("id, job_id, status")
      .eq("id", applicationId)
      .eq("job_id", jobId)
      .single();

    if (fetchError || !existingApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (existingApp.status !== "pending") {
      return res.status(400).json({ error: `Cannot update application - already ${existingApp.status}` });
    }

    // Update the application status
    const { data: updatedApp, error: updateError } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If accepting, update job status to 'pending' (assigned but not started)
    if (status === 'accepted') {
      // Set other pending applications for this job to 'rejected'
      try {
        await supabase
          .from('job_applications')
          .update({ status: 'rejected' })
          .neq('id', applicationId)
          .eq('job_id', jobId)
          .eq('status', 'pending');
      } catch (e) {
        console.warn('[AcceptFlow] failed to reject other pending applications', e);
      }

      // Update job status to 'planned'
      await supabase
        .from("jobs")
        .update({ status: "planned" })
        .eq("id", jobId);
    }

    res.json({
      message: `Applicant ${status}`,
      application: updatedApp,
    });
  } catch (err) {
    console.error("Error updating applicant:", err);
    res.status(500).json({ error: "Failed to update applicant" });
  }
});

/**
 * DELETE /jobs/:jobId
 * Delete a job (only by the client who owns it)
 */
router.delete("/:jobId", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const { client_id } = req.body; // Client ID to verify ownership

    if (!jobId) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // First verify the job exists and belongs to this client
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("id, client_id, title, status")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify ownership if client_id provided
    if (client_id && job.client_id !== parseInt(client_id, 10)) {
      return res.status(403).json({ error: "You can only delete your own jobs" });
    }

    // Check if there are accepted applications - don't allow deletion
    const { data: acceptedApps, error: appError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("status", "accepted");

    if (!appError && acceptedApps && acceptedApps.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete job with accepted applicants",
        message: "Je kunt geen job verwijderen waarvoor al een student geaccepteerd is."
      });
    }

    // Delete ALL applications for this job (pending, rejected, withdrawn)
    const { error: deleteAppsError } = await supabase
      .from("job_applications")
      .delete()
      .eq("job_id", jobId);

    if (deleteAppsError) {
      console.error("Error deleting applications:", deleteAppsError);
    }

    // Delete the job
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (deleteError) throw deleteError;

    res.json({
      message: "Job deleted successfully",
      deleted_job: { id: jobId, title: job.title }
    });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

/**
 * PATCH /jobs/:jobId/status
 * Update job status
 */
router.patch("/:jobId/status", async (req, res) => {
  try {
    console.log("=== PATCH /jobs/status Aangeroepen ===");
    const jobId = parseInt(req.params.jobId, 10);
    const { status, updated_by_role, student_id } = req.body;

    console.log(`Job: ${jobId}, Nieuwe Status: ${status}, Door: ${updated_by_role}`);

    if (!jobId) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // 1. Haal de huidige job op
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      console.error("Job niet gevonden:", fetchError);
      return res.status(404).json({ error: "Job not found" });
    }

    const currentStatus = job.status;
    console.log(`Huidige status in DB: ${currentStatus}`);

    // 2. Validatie Logica
    let isAllowed = false;
    let errorMessage = "";

    // SCENARIO A: De CLIENT wil iets aanpassen
    if (updated_by_role === 'client') {
        // Een client mag een job in principe altijd sluiten ('completed') 
        // zolang hij niet al 'paid' of 'cancelled' is.
        if (status === 'completed') {
            if (['paid', 'cancelled'].includes(currentStatus)) {
                isAllowed = false;
                errorMessage = "Job is al betaald of geannuleerd.";
            } else {
                isAllowed = true; // Client is de baas
            }
        } 
        // Andere status wijzigingen door client (bv. cancel)
        else {
            isAllowed = true; 
        }
    } 
    // SCENARIO B: De STUDENT wil iets aanpassen (strengere regels)
    else if (updated_by_role === 'student') {
        if (status === 'in_progress' && ['pending', 'assigned', 'open'].includes(currentStatus)) isAllowed = true;
        else if (status === 'completed' && currentStatus === 'in_progress') isAllowed = true;
        else {
            isAllowed = false;
            errorMessage = "Student mag deze statuswijziging niet doen.";
        }
    }
    // Foutieve rol
    else {
        isAllowed = false;
        errorMessage = "Onbekende rol of missende updated_by_role.";
    }

    if (!isAllowed) {
        console.warn(`Status update geweigerd: ${errorMessage}`);
        return res.status(403).json({ error: errorMessage });
    }

    // 3. Update uitvoeren in Database
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({ 
        status: status
        // updated_at verwijderd omdat kolom niet bestaat
      })
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) {
        console.error("Supabase update error:", updateError);
        throw updateError;
    }

    console.log("Update succesvol!", updatedJob);
    res.json({
      message: `Job status updated to '${status}'`,
      job: updatedJob
    });

  } catch (err) {
    console.error("CRITICAL ERROR updating job status:", err);
    res.status(500).json({ error: "Failed to update job status", details: err.message });
  }
});

/**
 * POST /jobs/:jobId/mark-in-progress
 * Student markeert job als "in_progress" (convenience endpoint)
 * Body: { student_id }
 */
router.post("/:jobId/mark-in-progress", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const { student_id } = req.body;

    if (!jobId || !student_id) {
      return res.status(400).json({ error: "job_id and student_id required" });
    }

    // Verify student has accepted application for this job
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("student_id", student_id)
      .eq("status", "accepted")
      .maybeSingle();

    if (appError || !application) {
      return res.status(403).json({ 
        error: "Student must have an accepted application for this job" 
      });
    }

    // Update job status to in_progress
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({ 
        status: "in_progress"
        // updated_at verwijderd
      })
      .eq("id", jobId)
      .eq("status", "pending") // Only allow transition from pending
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(400).json({ 
          error: "Job must be in 'pending' status to start" 
        });
      }
      throw updateError;
    }

    res.json({
      message: "Job marked as in progress",
      job: updatedJob,
    });
  } catch (err) {
    console.error("Error marking job in progress:", err);
    res.status(500).json({ error: "Failed to mark job in progress" });
  }
});

/**
 * POST /jobs/:jobId/mark-completed
 * Student markeert job als "completed" (convenience endpoint)
 * Body: { student_id }
 */
router.post("/:jobId/mark-completed", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const { student_id } = req.body;

    if (!jobId || !student_id) {
      return res.status(400).json({ error: "job_id and student_id required" });
    }

    // Verify student has accepted application for this job
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("student_id", student_id)
      .eq("status", "accepted")
      .maybeSingle();

    if (appError || !application) {
      return res.status(403).json({ 
        error: "Student must have an accepted application for this job" 
      });
    }

    // Get job details to check current status
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, hourly_or_fixed, hourly_rate, fixed_price")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({ 
        error: `Job must be 'in_progress' to mark as completed. Current status: ${job.status}` 
      });
    }

    // Update job status to completed
    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({ 
        status: "completed"
        // updated_at verwijderd
      })
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: "Job marked as completed. Client can now proceed with payment.",
      job: updatedJob,
      payment_info: {
        amount: job.hourly_or_fixed === "fixed" ? job.fixed_price : null,
        type: job.hourly_or_fixed,
        requires_client_payment: true,
      }
    });
  } catch (err) {
    console.error("Error marking job completed:", err);
    res.status(500).json({ error: "Failed to mark job completed" });
  }
});

/**
 * GET /jobs/:jobId/payment-info
 * Haal payment info op voor een completed job
 */
router.get("/:jobId/payment-info", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);

    if (!jobId) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // Get job with accepted student
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id, status, client_id, title,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "completed" && job.status !== "paid") {
      return res.status(400).json({ 
        error: `Job must be 'completed' or 'paid' to view payment info. Current: ${job.status}` 
      });
    }

    // Get accepted application to find student
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select(`
        id, student_id,
        users:student_id (
          id, email
        ),
        student_profiles!inner (
          id, school_name
        )
      `)
      .eq("job_id", jobId)
      .eq("status", "accepted")
      .maybeSingle();

    if (appError || !application) {
      return res.status(400).json({ 
        error: "No accepted student found for this job" 
      });
    }

    // Calculate amount in cents
    let amountCents = 0;
    if (job.hourly_or_fixed === "fixed") {
      amountCents = Math.round(job.fixed_price * 100); // Convert euros to cents
    } else if (job.hourly_or_fixed === "hourly" && job.hourly_rate) {
      // For hourly: calculate based on start/end time or default 2 hours
      amountCents = Math.round(job.hourly_rate * 100 * 2); // Default 2 hours
    }

    // Check if payment already exists
    const { data: existingPayment, error: paymentError } = await supabase
      .from("payments")
      .select("payment_intent_id, status, amount")
      .eq("job_id", jobId)
      .maybeSingle();

    res.json({
      job_id: jobId,
      job_title: job.title,
      job_status: job.status,
      student_id: application.student_id,
      student_email: application.users?.email,
      client_id: job.client_id,
      payment_type: job.hourly_or_fixed,
      amount_cents: amountCents,
      amount_euros: (amountCents / 100).toFixed(2),
      currency: "eur",
      payment_status: existingPayment ? existingPayment.status : "not_started",
      payment_intent_id: existingPayment?.payment_intent_id || null,
    });
  } catch (err) {
    console.error("Error fetching payment info:", err);
    res.status(500).json({ error: "Failed to fetch payment info" });
  }
});


/**
 * GET /jobs/:id
 * Get a specific job with full details
 * NOTE: This must be AFTER specific routes like /client/:clientId and /:jobId/applicants
 */
router.get("/:id", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text, street, house_number, postal_code, city, latitude, longitude,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at, image_url,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("id", jobId)
      .single();

    if (error?.code === "PGRST116" || !data) {
      return res.status(404).json({ error: "No job found with this ID" });
    }
    if (error) throw error;

    const job = mapJobRow(data);
    res.json(job);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

module.exports = router;