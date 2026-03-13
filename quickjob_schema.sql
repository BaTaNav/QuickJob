-- ============================================================
-- QuickJob - Complete Database Schema
-- Plak dit in de Supabase SQL Editor en klik "Run"
-- ============================================================

-- ============================================================
-- 0. CLEAN SLATE - Verwijder bestaande tabellen
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS student_availability CASCADE;
DROP TABLE IF EXISTS student_category_preferences CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS monthly_invoices CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS student_documents CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS job_categories CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. CORE TABLES (actief gebruikt)
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('student', 'client', 'admin')),
  phone         TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'nl' CHECK (preferred_language IN ('nl', 'fr', 'en')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,          -- soft-delete / ban
  last_login_at TIMESTAMPTZ,                            -- 🆕 track activiteit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Student Profiles ─────────────────────────────────────────
CREATE TABLE student_profiles (
  id                  INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name          TEXT,                              -- 🆕
  last_name           TEXT,                              -- 🆕
  date_of_birth       DATE,                              -- 🆕 leeftijdscheck
  school_name         TEXT,
  field_of_study      TEXT,
  academic_year       TEXT,
  bio                 TEXT,                              -- 🆕 korte beschrijving
  radius_km           INT DEFAULT 10,
  avatar_url          TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  active_since        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 🆕
);

-- ── Client Profiles ──────────────────────────────────────────
CREATE TABLE client_profiles (
  id                      INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name              TEXT,                          -- 🆕
  last_name               TEXT,                          -- 🆕
  company_name            TEXT,                          -- 🆕 voor bedrijven
  address_line            TEXT,
  postal_code             TEXT,
  city                    TEXT,
  region                  TEXT,
  avatar_url              TEXT,
  first_job_needs_approval BOOLEAN DEFAULT TRUE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 🆕
);

-- ── Job Categories ───────────────────────────────────────────
CREATE TABLE job_categories (
  id      SERIAL PRIMARY KEY,
  key     TEXT NOT NULL UNIQUE,
  name_nl TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon    TEXT                                           -- 🆕 emoji of icon-naam
);

-- Seed de categorieën (IDs moeten matchen met frontend PostJob.tsx)
INSERT INTO job_categories (id, key, name_nl, name_fr, name_en, icon) VALUES
  (1, 'cleaning',   'Schoonmaak',        'Nettoyage',           'Cleaning',    '🧹'),
  (2, 'garden',     'Tuinwerk',          'Jardinage',           'Gardening',   '🌿'),
  (3, 'repair',     'Reparatie',         'Réparation',          'Repair',      '🔧'),
  (4, 'moving',     'Verhuizing',        'Déménagement',        'Moving',      '📦'),
  (5, 'handyman',   'Klusjeswerk',       'Bricolage',           'Handyman',    '🔨'),
  (6, 'petcare',    'Dierenverzorging',  'Soins pour animaux',  'Pet care',    '🐾'),
  (7, 'painting',   'Schilderwerk',      'Peinture',            'Painting',    '🎨'),
  (8, 'groceries',  'Boodschappen',      'Courses',             'Groceries',   '🛒'),
  (9, 'tech',       'Technische hulp',   'Aide technique',      'Tech Help',   '💻'),
  (10, 'other',     'Overige',           'Autre',               'Other',       '📌');

-- Reset sequence to next available ID
SELECT setval('job_categories_id_seq', 10);

-- ── Jobs ─────────────────────────────────────────────────────
CREATE TABLE jobs (
  id            SERIAL PRIMARY KEY,
  client_id     INT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   INT    REFERENCES job_categories(id) ON DELETE SET NULL,
  title         TEXT   NOT NULL,
  description   TEXT,
  -- Adres (gestructureerd)
  street        TEXT,
  house_number  TEXT,
  postal_code   TEXT,
  city          TEXT,
  area_text     TEXT,                                    -- vrije tekst locatie
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  -- Prijs
  hourly_or_fixed TEXT NOT NULL DEFAULT 'hourly' CHECK (hourly_or_fixed IN ('hourly', 'fixed')),
  hourly_rate   NUMERIC(8,2),
  fixed_price   NUMERIC(8,2),
  -- Tijd
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  estimated_hours NUMERIC(4,1),                          -- 🆕 geschatte duur
  -- Status
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'planned', 'in_progress', 'completed', 'paid', 'expired', 'cancelled')),
  -- Media
  image_url     TEXT,
  -- Meta
  max_applicants INT DEFAULT 1,                          -- 🆕 meerdere studenten per job
  views_count   INT NOT NULL DEFAULT 0,                  -- 🆕 populariteit tracking
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()       -- 🆕
);

-- ── Job Applications ─────────────────────────────────────────
CREATE TABLE job_applications (
  id                SERIAL PRIMARY KEY,
  student_id        INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id            INT  NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'completed')),
  overlap_confirmed BOOLEAN DEFAULT FALSE,
  cover_message     TEXT,                                -- 🆕 motivatie
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at      TIMESTAMPTZ,                         -- 🆕 wanneer client reageerde
  UNIQUE(student_id, job_id)
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  job_id      INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  -- 🆕 Tweezijdige reviews
  reviewer_role TEXT NOT NULL DEFAULT 'client' CHECK (reviewer_role IN ('client', 'student')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, job_id, reviewer_role)
);

-- ── Student Documents ────────────────────────────────────────
CREATE TABLE student_documents (
  id            SERIAL PRIMARY KEY,
  student_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,                           -- passport, student_id, etc.
  file_url      TEXT NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by   INT REFERENCES users(id),               -- 🆕 welke admin
  reviewed_at   TIMESTAMPTZ,                             -- 🆕
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Monthly Billing ───────────────────────────────────────────
-- Replaces Stripe: tracks monthly invoices for clients
CREATE TABLE monthly_invoices (
  id                SERIAL PRIMARY KEY,
  client_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month             DATE NOT NULL,                       -- first day of billing month
  total_amount      INT NOT NULL DEFAULT 0,              -- in cents
  currency          TEXT NOT NULL DEFAULT 'eur',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  due_date          DATE,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- ── Payments (Monthly Billing) ───────────────────────────────
CREATE TABLE payments (
  id                SERIAL PRIMARY KEY,
  invoice_id        INT REFERENCES monthly_invoices(id) ON DELETE SET NULL,
  job_id            INT REFERENCES jobs(id) ON DELETE SET NULL,
  client_id         INT REFERENCES users(id) ON DELETE SET NULL,
  student_id        INT REFERENCES users(id) ON DELETE SET NULL,
  amount            INT NOT NULL,                        -- in cents
  currency          TEXT NOT NULL DEFAULT 'eur',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Incidents ────────────────────────────────────────────────
CREATE TABLE incidents (
  id             SERIAL PRIMARY KEY,
  job_id         INT REFERENCES jobs(id) ON DELETE SET NULL,
  application_id INT REFERENCES job_applications(id) ON DELETE SET NULL,
  student_id     INT REFERENCES users(id) ON DELETE SET NULL,
  client_id      INT REFERENCES users(id) ON DELETE SET NULL,
  reported_by    INT REFERENCES users(id),               -- 🆕 wie meldde het
  summary        TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  severity       TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. TOEKOMSTIGE TABELLEN (nog niet in code, maar klaar voor gebruik)
-- ============================================================

-- ── Notifications ────────────────────────────────────────────
-- Push notificaties, in-app meldingen
CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                             -- job_accepted, payment_received, new_review, etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,                                     -- extra payload (job_id, etc.)
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Conversations & Chat ─────────────────────────────────────
-- In-app messaging tussen student en client
CREATE TABLE conversations (
  id          SERIAL PRIMARY KEY,
  job_id      INT REFERENCES jobs(id) ON DELETE SET NULL,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, student_id, client_id)
);

CREATE TABLE chat_messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Favorites ────────────────────────────────────────────────
-- Studenten kunnen jobs bookmarken
CREATE TABLE favorites (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id      INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ── Student Availability ─────────────────────────────────────
-- Studenten geven beschikbaarheid op per dag
CREATE TABLE student_availability (
  id          SERIAL PRIMARY KEY,
  student_id  INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=maandag
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  UNIQUE(student_id, day_of_week, start_time)
);

-- ── Student Category Preferences ─────────────────────────────
-- Welke categorieën een student verkiest
CREATE TABLE student_category_preferences (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  UNIQUE(student_id, category_id)
);

-- ── Payouts ──────────────────────────────────────────────────
-- Tracking van uitbetalingen naar studenten
CREATE TABLE payouts (
  id                SERIAL PRIMARY KEY,
  student_id        INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id        INT  REFERENCES payments(id) ON DELETE SET NULL,
  stripe_payout_id  TEXT,
  stripe_transfer_id TEXT,
  amount            INT  NOT NULL,                       -- in centen
  currency          TEXT NOT NULL DEFAULT 'eur',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. INDEXES (snellere queries)
-- ============================================================

-- Jobs: meest gezochte queries
CREATE INDEX idx_jobs_client_id    ON jobs(client_id);
CREATE INDEX idx_jobs_status       ON jobs(status);
CREATE INDEX idx_jobs_category     ON jobs(category_id);
CREATE INDEX idx_jobs_start_time   ON jobs(start_time);
CREATE INDEX idx_jobs_location     ON jobs(latitude, longitude);
CREATE INDEX idx_jobs_created      ON jobs(created_at DESC);

-- Applications
CREATE INDEX idx_applications_student ON job_applications(student_id);
CREATE INDEX idx_applications_job     ON job_applications(job_id);
CREATE INDEX idx_applications_status  ON job_applications(status);

-- Reviews
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_job     ON reviews(job_id);

-- Payments
CREATE INDEX idx_payments_job    ON payments(job_id);
CREATE INDEX idx_payments_client ON payments(client_id);
-- (Stripe removed) idx_payments_intent no longer needed

-- Notifications
CREATE INDEX idx_notifications_user   ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Chat
CREATE INDEX idx_chat_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_conversations_student ON conversations(student_id);
CREATE INDEX idx_conversations_client  ON conversations(client_id);

-- Favorites
CREATE INDEX idx_favorites_student ON favorites(student_id);

-- Incidents
CREATE INDEX idx_incidents_status ON incidents(status);


-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at bij wijzigingen
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Koppel trigger aan tabellen met updated_at
CREATE TRIGGER trg_jobs_updated           BEFORE UPDATE ON jobs                  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_student_profiles_upd   BEFORE UPDATE ON student_profiles      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_client_profiles_upd    BEFORE UPDATE ON client_profiles       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated       BEFORE UPDATE ON payments              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_incidents_updated      BEFORE UPDATE ON incidents             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (Stripe removed) trg_stripe_accounts_upd no longer needed
CREATE TRIGGER trg_payouts_updated        BEFORE UPDATE ON payouts               FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 5. ROW LEVEL SECURITY (basis)
-- ============================================================

-- Activeer RLS op alle tabellen
ALTER TABLE users                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents           ENABLE ROW LEVEL SECURITY;
-- (Stripe removed) student_stripe_accounts RLS no longer needed
ALTER TABLE payments                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_availability        ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts                     ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS is ingeschakeld maar er zijn nog geen policies.
-- Je backend gebruikt de service_role key, dus die bypassed RLS automatisch.
-- Wanneer je later client-side Supabase queries toevoegt, moet je policies schrijven.
-- Voorbeeld policy (uncomment wanneer nodig):
--
-- CREATE POLICY "Users can read own profile"
--   ON users FOR SELECT
--   USING (auth.uid()::int = id);
--
-- CREATE POLICY "Open jobs are visible to everyone"
--   ON jobs FOR SELECT
--   USING (status = 'open');


-- ============================================================
-- 6. STORAGE BUCKETS (handmatig aanmaken in Supabase dashboard)
-- ============================================================
-- Ga naar Storage in je Supabase dashboard en maak aan:
--   1. "job-images"  (public)
--   2. "avatars"     (public)
--   3. "documents"   (private - alleen via service_role)


-- ============================================================
-- DONE! Je database is klaar.
-- ============================================================
