const express = require("express");
const supabase = require("../supabaseClient");

const router = express.Router();

const STATUS_VALUES = ["open", "in_review", "resolved", "dismissed"];
const SEVERITY_VALUES = ["low", "medium", "high"];

const toNullableInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMap = (rows, key = "id") => {
  const map = new Map();
  (rows || []).forEach((row) => {
    map.set(row[key], row);
  });
  return map;
};

async function fetchByIds(table, columns, ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .in("id", ids);

  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }

  return data || [];
}

async function hydrateIncidents(incidents) {
  if (!incidents || incidents.length === 0) return [];

  const jobIds = [...new Set(incidents.map((i) => i.job_id).filter(Boolean))];
  const studentIds = [...new Set(incidents.map((i) => i.student_id).filter(Boolean))];
  const clientIds = [...new Set(incidents.map((i) => i.client_id).filter(Boolean))];
  const applicationIds = [...new Set(incidents.map((i) => i.application_id).filter(Boolean))];

  const [jobs, students, clients, applications] = await Promise.all([
    fetchByIds("jobs", "id, title, area_text, start_time, status", jobIds),
    fetchByIds("users", "id, email, phone, role", studentIds),
    fetchByIds("users", "id, email, phone, role", clientIds),
    fetchByIds("job_applications", "id, job_id, student_id, status", applicationIds),
  ]);

  const jobMap = buildMap(jobs);
  const studentMap = buildMap(students);
  const clientMap = buildMap(clients);
  const appMap = buildMap(applications);

  return incidents.map((incident) => ({
    ...incident,
    job: jobMap.get(incident.job_id) || null,
    student: studentMap.get(incident.student_id) || null,
    client: clientMap.get(incident.client_id) || null,
    application: appMap.get(incident.application_id) || null,
  }));
}

router.get("/", async (req, res) => {
  try {
    const status = req.query.status;
    let query = supabase
      .from("incidents")
      .select(
        "id, job_id, application_id, student_id, client_id, status, severity, summary, description, admin_notes, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (status && STATUS_VALUES.includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ incidents: [], message: "No incidents found" });
    }

    const hydrated = await hydrateIncidents(data);
    return res.json({ incidents: hydrated, count: hydrated.length });
  } catch (err) {
    console.error("Error fetching incidents:", err);
    return res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      job_id,
      application_id,
      student_id,
      client_id,
      summary,
      description,
      severity = "medium",
      status = "open",
      admin_notes,
    } = req.body;

    if (!summary || !summary.trim()) {
      return res.status(400).json({ error: "summary is required" });
    }

    if (severity && !SEVERITY_VALUES.includes(severity)) {
      return res.status(400).json({ error: "Invalid severity value" });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const payload = {
      summary: summary.trim(),
      description: description || null,
      status: status || "open",
      severity: severity || "medium",
      job_id: toNullableInt(job_id),
      application_id: toNullableInt(application_id),
      student_id: toNullableInt(student_id),
      client_id: toNullableInt(client_id),
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("incidents")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const [hydrated] = await hydrateIncidents([data]);
    return res.status(201).json(hydrated);
  } catch (err) {
    console.error("Error creating incident:", err);
    return res.status(500).json({ error: "Failed to create incident" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, admin_notes, description, severity } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Invalid incident id" });
    }

    const updates = { updated_at: new Date().toISOString() };

    if (status !== undefined) {
      if (!STATUS_VALUES.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      updates.status = status;
    }

    if (severity !== undefined) {
      if (!SEVERITY_VALUES.includes(severity)) {
        return res.status(400).json({ error: "Invalid severity value" });
      }
      updates.severity = severity;
    }

    if (description !== undefined) {
      updates.description = description || null;
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes || null;
    }

    const { data, error } = await supabase
      .from("incidents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "Incident not found" });
    }
    if (error) throw error;

    const [hydrated] = await hydrateIncidents([data]);
    return res.json(hydrated);
  } catch (err) {
    console.error("Error updating incident:", err);
    return res.status(500).json({ error: "Failed to update incident" });
  }
});

module.exports = router;
