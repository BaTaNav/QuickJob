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
 * Optional query: ?status=open&limit=20
 */
router.get("/available", async (req, res) => {
  try {
    const status = req.query.status || "open";
    const limit = parseInt(req.query.limit) || 50;

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
      .eq("status", status)
      .order("start_time", { ascending: true })
      .limit(limit);

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

module.exports = router;
