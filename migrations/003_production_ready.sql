-- ============================================================
-- Migration 003: Production-Ready Updates
-- Run this AFTER quickjob_schema.sql in Supabase SQL Editor
-- ============================================================
-- This migration:
--   1. Adds IBAN to student_profiles
--   2. Creates password_resets table
--   3. Creates invoice_line_items table (for €20 fines + job payments)
--   4. Adds work tracking columns to job_applications
--   5. Creates uploads storage bucket references
--   6. Fixes Stripe leftovers from base schema
--   7. Drops broken index/trigger references
-- ============================================================


-- ── 1. Add IBAN column to student_profiles ────────────────────
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS iban TEXT;


-- ── 2. Password reset tokens ─────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  used          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token
  ON password_resets(token_hash);


-- ── 3. Invoice line items (for the invoicing system) ──────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id            SERIAL PRIMARY KEY,
  invoice_id    INT NOT NULL REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  item_type     TEXT NOT NULL CHECK (item_type IN ('job_payment', 'cancellation_fine', 'adjustment')),
  job_id        INT REFERENCES jobs(id) ON DELETE SET NULL,
  amount        DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice
  ON invoice_line_items(invoice_id);


-- ── 4. Update monthly_invoices: add missing columns ───────────
-- The base schema creates monthly_invoices with `month DATE` and `total_amount INT`.
-- Our invoicing code expects `billing_month TEXT` and `invoice_number TEXT`.
-- Add these columns if missing:
ALTER TABLE monthly_invoices
  ADD COLUMN IF NOT EXISTS billing_month TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Create unique index on invoice_number (ignore if exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number
  ON monthly_invoices(invoice_number);

-- Index for fast lookups by billing_month
CREATE INDEX IF NOT EXISTS idx_invoices_billing_month
  ON monthly_invoices(billing_month);


-- ── 5. Add work tracking columns to job_applications ──────────
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_signature TEXT;


-- ── 6. Fix: drop broken Stripe references from base schema ────
-- The base schema tries to create a trigger on student_stripe_accounts
-- which doesn't exist. Drop it safely if it exists:
DROP TRIGGER IF EXISTS trg_stripe_accounts_upd ON student_stripe_accounts;

-- Drop the broken index on payments.payment_intent_id
-- (this column doesn't exist in our schema)
DROP INDEX IF EXISTS idx_payments_intent;

-- Also drop RLS on nonexistent table (safe to ignore errors)
-- ALTER TABLE student_stripe_accounts DISABLE ROW LEVEL SECURITY;


-- ── 7. Add 'cancelled' status to monthly_invoices ─────────────
-- Update the CHECK constraint to include 'cancelled':
ALTER TABLE monthly_invoices DROP CONSTRAINT IF EXISTS monthly_invoices_status_check;
ALTER TABLE monthly_invoices ADD CONSTRAINT monthly_invoices_status_check
  CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled'));


-- ── 8. Trigger for updated_at on monthly_invoices ─────────────
-- The helper function update_updated_at() should already exist from base schema.
-- Just add the trigger:
DROP TRIGGER IF EXISTS trg_invoices_updated ON monthly_invoices;
CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON monthly_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 9. Enable RLS on new tables ───────────────────────────────
ALTER TABLE password_resets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items     ENABLE ROW LEVEL SECURITY;

-- NOTE: Your backend uses the Supabase service_role key,
-- which bypasses RLS. No policies needed until you add
-- client-side Supabase queries.


-- ============================================================
-- DONE! After running this:
--
-- 1. Go to Storage in Supabase Dashboard and create these buckets:
--    - "uploads"    (public = YES)  ← for student photos & documents
--    - "avatars"    (public = YES)  ← for profile pictures
--    - "job-images" (public = YES)  ← for job listing images
--
-- 2. Restart your backend server
-- ============================================================
