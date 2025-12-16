const express = require("express");
const supabase = require("../supabaseClient");
require("dotenv").config(); 
const router = express.Router();

// Helper: mooi object uit row
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
 * GET /jobs/overview?clientId=123
 * Geeft alle blokken voor de client-dashboard:
 * { open, planned, completed, today, counts }
 */
router.get("/overview", async (req, res) => {
  const clientId = Number(req.query.clientId);
  if (!clientId || Number.isNaN(clientId)) {
    return res.status(400).json({ error: "clientId_required" });
  }

  try {
    const { data, error } = await supabase
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
      )
      .eq("client_id", clientId)
      .order("start_time", { ascending: true });

    if (error) throw error;

    const jobs = data.map(mapJobRow);

    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const open = [];
    const planned = [];
    const completed = [];
    const today = [];

    for (const job of jobs) {
      const start = new Date(job.start_time);
      const startDateISO = job.start_time.slice(0, 10); // Supabase returns ISO string

      // Completed
      if (job.status === "completed") {
        completed.push(job);
      }
      // Today
      if (startDateISO === todayISO) {
        today.push(job);
      }

      // Open (nog niet gestart / niet gecancelled)
      if (job.status === "open" && start >= now) {
        open.push(job);
      }

      // Planned (toekomstig, niet cancelled of completed)
      if (
        startDateISO > todayISO &&
        ["open", "planned", "locked", "in_progress"].includes(job.status)
      ) {
        planned.push(job);
      }
    }

    res.json({
      client_id: clientId,
      counts: {
        open: open.length,
        planned: planned.length,
        completed: completed.length,
        today: today.length,
      },
      open,
      planned,
      completed,
      today,
    });
  } catch (err) {
    console.error("Error fetching jobs overview:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * POST /jobs
 * Body: { client_id, category_id, title, description, area_text, hourly_or_fixed, hourly_rate, fixed_price, start_time }
 */
router.post("/", async (req, res) => {
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

  if (!client_id || !title || !start_time) {
    return res.status(400).json({ error: "client_id, title, start_time required" });
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          client_id,
          category_id: category_id ?? null,
          title,
          description: description ?? null,
          area_text: area_text ?? null,
          hourly_or_fixed: hourly_or_fixed ?? "hourly",
          hourly_rate: hourly_rate ?? null,
          fixed_price: fixed_price ?? null,
          start_time,
        },
      ])
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
      )
      .single();

    if (error) throw error;

    res.status(201).json(mapJobRow(data));
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * GET /jobs/:id  – details van één job
 */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "invalid_id" });
  }

  try {
    const { data, error } = await supabase
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
      )
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "job_not_found" });
    }
    if (error) throw error;

    res.json(mapJobRow(data));
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

module.exports = router;  // ✅ this is important
