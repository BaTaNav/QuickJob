-- ============================================================
-- Migration 002: Security & Invoicing
-- Run this in Supabase SQL Editor
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

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token
  ON password_resets(token_hash);

-- ── 3. Monthly invoices ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id              SERIAL PRIMARY KEY,
  client_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month   TEXT NOT NULL,          -- 'YYYY-MM' format
  invoice_number  TEXT NOT NULL UNIQUE,   -- 'QJ-YYYYMM-clientId'
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date        TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, billing_month)
);

CREATE INDEX IF NOT EXISTS idx_invoices_client
  ON monthly_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON monthly_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_month
  ON monthly_invoices(billing_month);

-- ── 4. Invoice line items ────────────────────────────────────
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

-- ── 5. Add work tracking columns to job_applications ─────────
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_signature TEXT;

-- ── 6. Add 'cancelled' to jobs status if not exists ──────────
-- (The CHECK constraint may need updating if it doesn't allow 'cancelled')
-- Try to add it — if the constraint exists, you may need to:
-- ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
-- ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
--   CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));

-- ── 7. Triggers for updated_at ───────────────────────────────
CREATE TRIGGER IF NOT EXISTS trg_invoices_updated
  BEFORE UPDATE ON monthly_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 8. RLS on new tables ─────────────────────────────────────
ALTER TABLE password_resets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items     ENABLE ROW LEVEL SECURITY;

-- ── Done! ────────────────────────────────────────────────────
-- Run this migration, then restart your backend server.
