// Clients/clients.js
const express = require("express");
const bcrypt = require("bcrypt");
const supabase = require("../supabaseClient");

const clientsRouter = express.Router();
const jobsRouter = express.Router();

// Helper: maak mooi object uit joined rows
function mapClientRow(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    phone: row.phone,
    preferred_language: row.preferred_language,
    created_at: row.created_at,
    profile: row.client_profiles
      ? {
          address_line: row.client_profiles.address_line,
          postal_code: row.client_profiles.postal_code,
          city: row.client_profiles.city,
          region: row.client_profiles.region,
          first_job_needs_approval: row.client_profiles.first_job_needs_approval,
        }
      : null,
  };
}

/**
 * CREATE client (users + client_profiles)
 * POST /clients
 */
clientsRouter.post("/", async (req, res) => {
  const {
    email,
    password,
    phone,
    preferred_language,
    address_line,
    postal_code,
    city,
    region,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    // check of email al bestaat
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return res.status(409).json({ error: "email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 1) new user
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          role: "client",
          phone: phone || null,
          preferred_language: preferred_language || "nl",
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    // 2) client_profile
    const { error: profileError } = await supabase
      .from("client_profiles")
      .insert([
        {
          id: newUser.id,
          address_line: address_line || null,
          postal_code: postal_code || null,
          city: city || null,
          region: region || null,
        },
      ]);

    if (profileError) throw profileError;

    // 3) joined fetch
    const { data: fullClient, error: joinedError } = await supabase
      .from("users")
      .select(
        `
        id, email, role, phone, preferred_language, created_at,
        client_profiles (address_line, postal_code, city, region, first_job_needs_approval)
      `
      )
      .eq("id", newUser.id)
      .eq("role", "client")
      .single();

    if (joinedError) throw joinedError;

    res.status(201).json(mapClientRow(fullClient));
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * READ ALL clients
 * GET /clients
 */
clientsRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id, email, role, phone, preferred_language, created_at,
        client_profiles (address_line, postal_code, city, region, first_job_needs_approval)
      `
      )
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data.map(mapClientRow));
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * READ ONE client
 * GET /clients/:id
 */
clientsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id, email, role, phone, preferred_language, created_at,
        client_profiles (address_line, postal_code, city, region, first_job_needs_approval)
      `
      )
      .eq("role", "client")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      // no rows
      return res.status(404).json({ error: "client_not_found" });
    }
    if (error) throw error;

    res.json(mapClientRow(data));
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * UPDATE client
 * PATCH /clients/:id
 */
clientsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const {
    email,
    phone,
    preferred_language,
    address_line,
    postal_code,
    city,
    region,
    first_job_needs_approval,
  } = req.body;

  try {
    // update users
    const userUpdate = {};
    if (email !== undefined) userUpdate.email = email;
    if (phone !== undefined) userUpdate.phone = phone;
    if (preferred_language !== undefined)
      userUpdate.preferred_language = preferred_language;

    if (Object.keys(userUpdate).length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .update(userUpdate)
        .eq("id", id)
        .eq("role", "client");
      if (userError) throw userError;
    }

    // update client_profiles
    const profileUpdate = {};
    if (address_line !== undefined) profileUpdate.address_line = address_line;
    if (postal_code !== undefined) profileUpdate.postal_code = postal_code;
    if (city !== undefined) profileUpdate.city = city;
    if (region !== undefined) profileUpdate.region = region;
    if (first_job_needs_approval !== undefined)
      profileUpdate.first_job_needs_approval = first_job_needs_approval;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from("client_profiles")
        .update(profileUpdate)
        .eq("id", id);
      if (profileError) throw profileError;
    }

    // get updated record
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id, email, role, phone, preferred_language, created_at,
        client_profiles (address_line, postal_code, city, region, first_job_needs_approval)
      `
      )
      .eq("role", "client")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.status(404).json({ error: "client_not_found" });
    }
    if (error) throw error;

    res.json(mapClientRow(data));
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * DELETE client (hard delete)
 * DELETE /clients/:id
 */
clientsRouter.delete("/:id", async (req, res) => {
  // Toggle activation (de)activate client if possible; otherwise fall back to hard delete
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    // try to fetch the user to see if an `is_active` column exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("id", id)
      .eq("role", "client")
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return res.status(404).json({ error: "client_not_found" });
    }

    // If the `is_active` column exists, toggle it
    if (Object.prototype.hasOwnProperty.call(user, "is_active")) {
      const newActive = !user.is_active;
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({ is_active: newActive })
        .eq("id", id)
        .eq("role", "client")
        .select("id")
        .single();

      if (updateError) throw updateError;

      return res.json({ message: newActive ? "client_activated" : "client_deactivated", id: updated.id });
    }

    // Fallback: no is_active column — perform hard delete (profile then user)
    const { error: profileError } = await supabase
      .from("client_profiles")
      .delete()
      .eq("id", id);
    if (profileError) throw profileError;

    const { data: deletedUser, error: delUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "client")
      .select("id")
      .single();

    if (delUserError && delUserError.code === "PGRST116") {
      return res.status(404).json({ error: "client_not_found" });
    }
    if (delUserError) throw delUserError;

    res.json({ message: "client_deleted", id: deletedUser.id });
  } catch (err) {
    console.error("Error deleting/ toggling client:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});


/**
 * GET all jobs for a client
 * GET /clients/:id/jobs
 */
clientsRouter.get("/:id/jobs", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching client jobs:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

/**
 * JOBS ROUTER (exported separately so server can mount at /jobs)
 * This keeps all backend route code inside the `clients` folder as requested.
 */

/**
 * POST /jobs -> create a job by a client
 * body: { client_id, title, description, location, price }
 */
jobsRouter.post('/', async (req, res) => {
  const { client_id, title, description, location, price } = req.body;

  if (!client_id || !title) {
    return res.status(400).json({ error: 'client_id and title are required' });
  }

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          client_id,
          title,
          description: description || null,
          location: location || null,
          price: price || null,
          status: 'open',
          locked: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * GET /jobs/:id -> job details
 */
jobsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'job_not_found' });

    res.json(data);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * PATCH /jobs/:id -> update job (respect locked state)
 */
jobsRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const { title, description, location, price, status, locked } = req.body;

  try {
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, locked')
      .eq('id', id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return res.status(404).json({ error: 'job_not_found' });

    if (job.locked) {
      return res.status(409).json({ error: 'job_locked' });
    }

    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (price !== undefined) update.price = price;
    if (status !== undefined) update.status = status;
    if (locked !== undefined) update.locked = locked;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'no_fields_to_update' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('jobs')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(updated);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * DELETE /jobs/:id -> cancel job (soft cancel by setting status)
 */
jobsRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    // set status to 'cancelled'
    const { data, error } = await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'job_cancelled', id: data.id });
  } catch (err) {
    console.error('Error cancelling job:', err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

module.exports = { clientsRouter, jobsRouter };
