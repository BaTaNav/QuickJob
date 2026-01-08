const express = require("express");
const Stripe = require("stripe");
const supabase = require("../supabaseClient");

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const defaultCurrency = (process.env.STRIPE_DEFAULT_CURRENCY || "eur").toLowerCase();
const feePercent = Number(process.env.STRIPE_FEE_PERCENT || 0);
const connectCountry = process.env.STRIPE_CONNECT_COUNTRY || "BE";
const connectReturnUrl = process.env.STRIPE_CONNECT_RETURN_URL || "https://example.com/stripe/return";
const connectRefreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || "https://example.com/stripe/refresh";

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : null;
const router = express.Router();

const ensureStripe = (res) => {
  if (!stripe) {
    res.status(500).json({ error: "Stripe secret key ontbreekt (STRIPE_SECRET_KEY)" });
    return false;
  }
  return true;
};

router.post("/connect-account", async (req, res) => {
  if (!ensureStripe(res)) return;
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: "student_id is verplicht" });

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", student_id)
    .eq("role", "student")
    .maybeSingle();
  if (studentError) return res.status(500).json({ error: "Supabase fout (student lookup)", details: studentError });
  if (!student) return res.status(404).json({ error: "Student niet gevonden" });

  const { data: accountRow, error: lookupError } = await supabase
    .from("student_stripe_accounts")
    .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted")
    .eq("student_id", student_id)
    .maybeSingle();
  if (lookupError) return res.status(500).json({ error: "Supabase fout (account lookup)", details: lookupError });

  let accountId = accountRow?.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: connectCountry,
      email: student.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    const { error: upsertError } = await supabase
      .from("student_stripe_accounts")
      .upsert(
        {
          student_id,
          stripe_account_id: accountId,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      );
    if (upsertError) return res.status(500).json({ error: "Supabase fout (opslaan account)", details: upsertError });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: connectRefreshUrl,
    return_url: connectReturnUrl,
    type: "account_onboarding",
  });

  res.json({
    stripe_account_id: accountId,
    onboarding_url: link.url,
    expires_at: link.expires_at,
    existing: Boolean(accountRow?.stripe_account_id),
  });
});

router.post("/create-payment-intent", async (req, res) => {
  if (!ensureStripe(res)) return;
  const { student_id, job_id, client_id, amount, currency, description } = req.body;
  const amountInt = parseInt(amount, 10);
  if (!student_id || !amountInt) {
    return res.status(400).json({ error: "student_id en amount (in cents) zijn verplicht" });
  }

  const currencyCode = (currency || defaultCurrency).toLowerCase();
  const { data: accountRow, error: accountError } = await supabase
    .from("student_stripe_accounts")
    .select("stripe_account_id")
    .eq("student_id", student_id)
    .maybeSingle();
  if (accountError) return res.status(500).json({ error: "Supabase fout (account lookup)", details: accountError });
  if (!accountRow?.stripe_account_id) {
    return res.status(400).json({ error: "Student heeft nog geen Stripe account. Onboard eerst." });
  }

  const feeAmount = feePercent > 0 ? Math.round(amountInt * (feePercent / 100)) : undefined;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInt,
    currency: currencyCode,
    automatic_payment_methods: { enabled: true },
    description: description || `Job ${job_id || ""} betaling`,
    transfer_data: { destination: accountRow.stripe_account_id },
    application_fee_amount: feeAmount,
    metadata: {
      student_id: String(student_id),
      job_id: job_id ? String(job_id) : "",
      client_id: client_id ? String(client_id) : "",
    },
  });

  res.json({
    payment_intent_id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
  });
});


/**
 * POST /payments/request-payment
 * Client vraagt betaling aan voor een afgeronde job
 * Body: { job_id, client_id, student_id, amount (in cents), currency }
 */
router.post("/request-payment", async (req, res) => {
  if (!ensureStripe(res)) return;
  
  const { job_id, client_id, student_id, amount, currency } = req.body;
  const amountInt = parseInt(amount, 10);
  
  // Validatie
  if (!job_id || !client_id || !student_id || !amountInt) {
    return res.status(400).json({
      error: "Missing required fields: job_id, client_id, student_id, amount",
    });
  }

  // Controleer of job echt in "completed" status is
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status, client_id, hourly_or_fixed, hourly_rate, fixed_price")
    .eq("id", job_id)
    .maybeSingle();

  if (jobError) return res.status(500).json({ error: "Supabase fout (job lookup)", details: jobError });
  if (!job) return res.status(404).json({ error: "Job niet gevonden" });
  if (job.status !== "completed") {
    return res.status(400).json({ error: "Job moet 'completed' status hebben voordat je kan betalen" });
  }
  if (job.client_id !== parseInt(client_id, 10)) {
    return res.status(403).json({ error: "Je bent niet de client van deze job" });
  }

  // Controleer of student een Stripe account heeft
  const { data: accountRow, error: accountError } = await supabase
    .from("student_stripe_accounts")
    .select("stripe_account_id, details_submitted")
    .eq("student_id", student_id)
    .maybeSingle();

  if (accountError) return res.status(500).json({ error: "Supabase fout (account lookup)", details: accountError });
  if (!accountRow?.stripe_account_id) {
    return res.status(400).json({ error: "Student heeft nog geen Stripe account geregistreerd" });
  }
  if (!accountRow.details_submitted) {
    return res.status(400).json({ error: "Student moet eerst Stripe onboarding afmaken" });
  }

  const currencyCode = (currency || defaultCurrency).toLowerCase();
  const feeAmount = feePercent > 0 ? Math.round(amountInt * (feePercent / 100)) : undefined;

  try {
    // Maak Payment Intent aan
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInt,
      currency: currencyCode,
      automatic_payment_methods: { enabled: true },
      description: `Job ${job_id} - ${job.hourly_or_fixed === "hourly" ? "Uurloon" : "Vaste prijs"} betaling`,
      transfer_data: { destination: accountRow.stripe_account_id },
      application_fee_amount: feeAmount,
      metadata: {
        student_id: String(student_id),
        job_id: String(job_id),
        client_id: String(client_id),
        payment_type: "job_completion",
      },
    });

    res.status(201).json({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: amountInt,
      currency: currencyCode,
      job_id: job_id,
      student_id: student_id,
      message: "Payment intent aangemaakt. Client kan nu betalen.",
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ error: "Fout bij maken van payment intent", details: err.message });
  }
});

/**
 * GET /payments/payment/:paymentIntentId
 * Get payment status by payment intent ID
 */
router.get("/payment/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    // Haal payment info uit database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (paymentError) {
      console.error("Error fetching payment:", paymentError);
      return res.status(500).json({ error: "Failed to fetch payment", details: paymentError });
    }

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({
      payment_intent_id: payment.payment_intent_id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      student_id: payment.student_id,
      job_id: payment.job_id,
      client_id: payment.client_id,
      last_event: payment.last_event,
      updated_at: payment.updated_at,
    });
  } catch (err) {
    console.error("Error in GET /payments/payment/:paymentIntentId:", err);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});


/**
 * Webhook handler voor Stripe events
 * Verwerkt payment_intent.succeeded en payment_intent.payment_failed
 * Bij success: update job status naar 'paid'
 */
async function paymentsWebhookHandler(req, res) {
  if (!stripe) return res.status(500).json({ error: "Stripe secret key ontbreekt" });
  if (!webhookSecret) return res.status(400).send("STRIPE_WEBHOOK_SECRET ontbreekt");

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature failed", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Webhook event received: ${event.type}`);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log(`✅ Payment succeeded: ${intent.id}`);
    
    try {
      // Sla payment op in database
      const { error: persistError } = await supabase
        .from("payments")
        .upsert(
          {
            payment_intent_id: intent.id,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
            student_id: intent.metadata?.student_id ? Number(intent.metadata.student_id) : null,
            job_id: intent.metadata?.job_id ? Number(intent.metadata.job_id) : null,
            client_id: intent.metadata?.client_id ? Number(intent.metadata.client_id) : null,
            last_event: event.type,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "payment_intent_id" }
        );
      if (persistError) console.error("Persist payment failed", persistError);

      // Update job status naar "paid" als betaling geslaagd is
      const jobId = intent.metadata?.job_id ? Number(intent.metadata.job_id) : null;
      if (jobId) {
        const { error: jobUpdateError } = await supabase
          .from("jobs")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", jobId);

        if (jobUpdateError) {
          console.error("Error updating job status to paid:", jobUpdateError);
        } else {
          console.log(`✅ Job ${jobId} status updated to 'paid'`);
        }
      }
    } catch (persistErr) {
      console.error("Unexpected persist error", persistErr);
    }
  } 
  else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    console.log(`❌ Payment failed: ${intent.id}`);
    
    try {
      const { error: persistError } = await supabase
        .from("payments")
        .upsert(
          {
            payment_intent_id: intent.id,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
            student_id: intent.metadata?.student_id ? Number(intent.metadata.student_id) : null,
            job_id: intent.metadata?.job_id ? Number(intent.metadata.job_id) : null,
            client_id: intent.metadata?.client_id ? Number(intent.metadata.client_id) : null,
            last_event: event.type,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "payment_intent_id" }
        );
      if (persistError) console.error("Persist payment failed event", persistError);
      
      // Job blijft op "completed" status, client kan opnieuw proberen
    } catch (persistErr) {
      console.error("Unexpected persist error", persistErr);
    }
  }

  res.json({ received: true });
}

/**
 * GET /payments/connect/return
 * Stripe redirect na account onboarding
 */
router.get("/connect/return", async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Als er een code is, was de onboarding succesvol
    if (code) {
      // TODO: Als nodig, kan je hier de account details updaten in Supabase
      // Voor nu, stuur gewoon een success pagina
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stripe Account Connected</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .container { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #176B51; margin: 0 0 10px 0; }
              p { color: #666; margin: 10px 0; }
              .success { color: #22c55e; font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✓</div>
              <h1>Stripe Account Connected!</h1>
              <p>Your Stripe Connect account has been successfully set up.</p>
              <p>You can now receive payments for completed jobs.</p>
              <p style="margin-top: 30px; color: #999; font-size: 14px;">You can close this window and return to the app.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // Als geen code, was onboarding geannuleerd
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stripe Setup Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #ef4444; margin: 0 0 10px 0; }
            p { color: #666; margin: 10px 0; }
            .error { color: #ef4444; font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">✕</div>
            <h1>Setup Cancelled</h1>
            <p>Stripe account setup was cancelled or failed.</p>
            <p>Please try again or contact support if you need help.</p>
            <p style="margin-top: 30px; color: #999; font-size: 14px;">You can close this window and return to the app.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error handling Stripe return:", err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Error</h1>
            <p>Something went wrong. Please try again.</p>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = {
  paymentsRouter: router,
  paymentsWebhookHandler,
};
