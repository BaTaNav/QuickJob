const express = require("express");
const supabase = require("../supabaseClient");
const { requireRole } = require("../middleware/roleGuard");

const router = express.Router();

const CANCELLATION_FINE = 20.00; // €20 per cancelled job

// ──────────────────────────────────────────────────────────────
// GET /invoices/client/:clientId
// Get all invoices for a client
// ──────────────────────────────────────────────────────────────
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);

    // Verify the requesting user is the client or admin
    if (req.user.role !== "admin" && req.user.id !== clientId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("monthly_invoices")
      .select("*")
      .eq("client_id", clientId)
      .order("billing_month", { ascending: false });

    if (error) throw error;

    res.json({
      invoices: data || [],
      count: (data || []).length,
    });
  } catch (err) {
    console.error("Error fetching client invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /invoices/:invoiceId
// Get a single invoice with line items
// ──────────────────────────────────────────────────────────────
router.get("/:invoiceId", async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);

    const { data: invoice, error: invError } = await supabase
      .from("monthly_invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invError || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Verify access
    if (req.user.role !== "admin" && req.user.id !== invoice.client_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get line items
    const { data: lineItems, error: lineError } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (lineError) throw lineError;

    res.json({
      invoice,
      line_items: lineItems || [],
    });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /invoices/generate-monthly (Admin only)
// Generate monthly invoices for all clients
// ──────────────────────────────────────────────────────────────
router.post("/generate-monthly", requireRole("admin"), async (req, res) => {
  try {
    const { billing_month } = req.body; // Format: 'YYYY-MM'

    if (!billing_month || !/^\d{4}-\d{2}$/.test(billing_month)) {
      return res.status(400).json({ error: "billing_month is required (YYYY-MM format)" });
    }

    const monthStart = new Date(`${billing_month}-01T00:00:00Z`);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get all completed jobs in this billing month
    const { data: completedJobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        id, client_id, title, hourly_or_fixed, hourly_rate, fixed_price,
        start_time, end_time, status
      `)
      .eq("status", "completed")
      .gte("end_time", monthStart.toISOString())
      .lt("end_time", nextMonth.toISOString());

    if (jobsError) throw jobsError;

    // Get cancelled jobs (fine of €20 each) - jobs that were open/in_progress then cancelled
    const { data: cancelledJobs, error: cancelError } = await supabase
      .from("jobs")
      .select("id, client_id, title, status, created_at")
      .eq("status", "cancelled")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonth.toISOString());

    if (cancelError) throw cancelError;

    // Group by client
    const clientInvoices = {};

    // Add completed job charges
    for (const job of (completedJobs || [])) {
      if (!clientInvoices[job.client_id]) {
        clientInvoices[job.client_id] = { jobs: [], fines: [], total: 0 };
      }

      let amount = 0;
      if (job.hourly_or_fixed === "fixed") {
        amount = job.fixed_price || 0;
      } else if (job.hourly_or_fixed === "hourly") {
        // Calculate hours from actual work time
        const start = new Date(job.start_time);
        const end = new Date(job.end_time);
        const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
        amount = hours * (job.hourly_rate || 0);
      }

      amount = Math.round(amount * 100) / 100; // Round to 2 decimals
      clientInvoices[job.client_id].jobs.push({
        job_id: job.id,
        title: job.title,
        type: "job_payment",
        amount,
      });
      clientInvoices[job.client_id].total += amount;
    }

    // Add cancellation fines
    for (const job of (cancelledJobs || [])) {
      if (!clientInvoices[job.client_id]) {
        clientInvoices[job.client_id] = { jobs: [], fines: [], total: 0 };
      }

      clientInvoices[job.client_id].fines.push({
        job_id: job.id,
        title: job.title,
        type: "cancellation_fine",
        amount: CANCELLATION_FINE,
      });
      clientInvoices[job.client_id].total += CANCELLATION_FINE;
    }

    // Create invoices
    const createdInvoices = [];
    for (const [clientId, data] of Object.entries(clientInvoices)) {
      if (data.total <= 0) continue;

      const invoiceNumber = `QJ-${billing_month.replace("-", "")}-${clientId}`;

      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from("monthly_invoices")
        .upsert({
          client_id: parseInt(clientId),
          billing_month: billing_month,
          invoice_number: invoiceNumber,
          total_amount: Math.round(data.total * 100) / 100,
          status: "pending",
          due_date: new Date(nextMonth.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days after month end
          created_at: new Date().toISOString(),
        }, { onConflict: "client_id,billing_month" })
        .select()
        .single();

      if (invError) {
        console.error(`Invoice creation error for client ${clientId}:`, invError);
        continue;
      }

      // Create line items
      const lineItems = [
        ...data.jobs.map(j => ({
          invoice_id: invoice.id,
          description: `Job: ${j.title}`,
          item_type: "job_payment",
          job_id: j.job_id,
          amount: j.amount,
        })),
        ...data.fines.map(f => ({
          invoice_id: invoice.id,
          description: `Cancellation fine: ${f.title}`,
          item_type: "cancellation_fine",
          job_id: f.job_id,
          amount: f.amount,
        })),
      ];

      if (lineItems.length > 0) {
        await supabase.from("invoice_line_items").insert(lineItems);
      }

      createdInvoices.push(invoice);
    }

    res.status(201).json({
      message: `Generated ${createdInvoices.length} invoices for ${billing_month}`,
      invoices: createdInvoices,
    });
  } catch (err) {
    console.error("Error generating invoices:", err);
    res.status(500).json({ error: "Failed to generate invoices" });
  }
});

// ──────────────────────────────────────────────────────────────
// PATCH /invoices/:invoiceId/status (Admin only)
// Update invoice status (pending → paid, overdue, etc.)
// ──────────────────────────────────────────────────────────────
router.patch("/:invoiceId/status", requireRole("admin"), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    const { status } = req.body;

    const validStatuses = ["pending", "sent", "paid", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const updates = { status };
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("monthly_invoices")
      .update(updates)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Invoice status updated to ${status}`, invoice: data });
  } catch (err) {
    console.error("Error updating invoice status:", err);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /invoices/admin/all (Admin only)
// Get all invoices with filters
// ──────────────────────────────────────────────────────────────
router.get("/admin/all", requireRole("admin"), async (req, res) => {
  try {
    const { status, billing_month } = req.query;

    let query = supabase
      .from("monthly_invoices")
      .select(`
        *,
        client:users!client_id (id, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (billing_month) query = query.eq("billing_month", billing_month);

    const { data, error } = await query;
    if (error) throw error;

    const totalOutstanding = (data || [])
      .filter(i => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    res.json({
      invoices: data || [],
      count: (data || []).length,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
    });
  } catch (err) {
    console.error("Error fetching all invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

module.exports = router;