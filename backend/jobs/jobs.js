const express = require("express");
const { supabase } = require("../supabaseClient");
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
        title, description, area_text,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("status", status)
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
      count: jobs.length
    });
  } catch (err) {
    console.error("Error fetching available jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/**
 * GET /jobs/:id
 * Get a specific job with full details
 */
router.get("/:id", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id, client_id, category_id,
        title, description, area_text,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("id", jobId)
      .single();

    if (error?.code === 'PGRST116' || !data) {
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
        title, description, area_text,
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at,
        job_categories (
          id, key, name_nl, name_fr, name_en
        )
      `
      )
      .eq("status", "open");

    // Add filters
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    if (location) {
      query = query.ilike("area_text", `%${location}%`);
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
      count: jobs.length
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
      hourly_or_fixed,
      hourly_rate,
      fixed_price,
      start_time,
    } = req.body;

    const clientIdNum = parseInt(client_id, 10);
    const categoryIdNum = parseInt(category_id, 10);

    // Validate required fields
    if (!clientIdNum || !categoryIdNum || !title || !start_time) {
      return res.status(400).json({
        error: "Missing required fields: client_id, category_id, title, start_time",
      });
    }

    // Validate hourly_or_fixed and corresponding price
    if (hourly_or_fixed === "fixed" && !fixed_price) {
      return res.status(400).json({ error: "Fixed price required for fixed jobs" });
    }

    // Insert job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: clientIdNum,
        category_id: categoryIdNum,
        title,
        description: description || null,
        area_text: area_text || null,
        hourly_or_fixed,
        hourly_rate: hourly_rate || null,
        fixed_price: fixed_price || null,
        start_time,
        status: "open",
        created_at: new Date().toISOString(),
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
 * POST /jobs/draft
 * Save a draft job (status=draft)
 */
router.post("/draft", async (req, res) => {
  try {
    const {
      client_id,
      category_id,
      title,
      description,
      area_text,
      hourly_or_fixed,
      hourly_rate,
      fixed_price,
      start_time,
    } = req.body;

    const clientIdNum = parseInt(client_id, 10);
    const categoryIdNum = parseInt(category_id, 10);

    // Minimal required fields for draft
    if (!clientIdNum || !categoryIdNum || !title) {
      return res.status(400).json({
        error: "Missing required fields: client_id, category_id, title",
      });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: clientIdNum,
        category_id: categoryIdNum,
        title,
        description: description || null,
        area_text: area_text || null,
        hourly_or_fixed: hourly_or_fixed || "hourly",
        hourly_rate: hourly_rate || null,
        fixed_price: fixed_price || null,
        start_time: start_time || null,
        status: "draft",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    const mapped = mapJobRow(job);
    res.status(201).json({
      message: "Job draft saved",
      job: mapped,
    });
  } catch (err) {
    console.error("Error saving draft:", err);
    res.status(500).json({ error: "Failed to save draft" });
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
        hourly_or_fixed, hourly_rate, fixed_price,
        start_time, status, created_at,
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

    const jobs = data?.map(mapJobRow) || [];
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

module.exports = router;
