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
