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
