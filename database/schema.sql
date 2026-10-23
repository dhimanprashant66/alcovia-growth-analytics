-- Alcovia GTM analytical schema (proposed design). No real Alcovia data included.
-- Intended for PostgreSQL 15+. Numeric currency values are stored in integer paise.
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('program','workshop')),
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('meta','organic','referral','other')),
  campaign_id TEXT REFERENCES campaigns(id),
  external_clickup_id TEXT UNIQUE
);
CREATE TABLE lead_stage_events (
  id BIGSERIAL PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  stage TEXT NOT NULL CHECK (stage IN ('qualified','discovery_scheduled','discovery_attended','ambition_interview','architect_session','paid')),
  occurred_at TIMESTAMPTZ NOT NULL,
  external_event_id TEXT UNIQUE,
  UNIQUE(lead_id, stage)
);
CREATE INDEX idx_lead_events_lead_time ON lead_stage_events(lead_id, occurred_at);
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('discovery','ambition','architect')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  attended_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  student_id TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('trial','full')),
  enrolled_at TIMESTAMPTZ NOT NULL,
  onboarded_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  renewed_at TIMESTAMPTZ
);
CREATE TABLE workshops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  session_at TIMESTAMPTZ NOT NULL,
  price_paise BIGINT NOT NULL DEFAULT 399900 CHECK (price_paise >= 0)
);
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  category TEXT NOT NULL CHECK (category IN ('program','workshop')),
  gross_amount_paise BIGINT NOT NULL CHECK (gross_amount_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE workshop_bookings (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  seats SMALLINT NOT NULL CHECK (seats > 0)
);
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  issued_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0)
);
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  invoice_id TEXT REFERENCES invoices(id),
  processed_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('capture','refund')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  source TEXT NOT NULL CHECK (source IN ('razorpay','manual_reconciled')),
  external_transaction_id TEXT UNIQUE
);
CREATE TABLE ad_daily_metrics (
  report_date DATE NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  creative_id TEXT NOT NULL,
  impressions BIGINT NOT NULL CHECK (impressions >= 0),
  reach BIGINT NOT NULL CHECK (reach >= 0),
  link_clicks BIGINT NOT NULL CHECK (link_clicks >= 0),
  spend_paise BIGINT NOT NULL CHECK (spend_paise >= 0),
  PRIMARY KEY (report_date, campaign_id, creative_id)
);
CREATE TABLE landing_daily_metrics (
  report_date DATE NOT NULL,
  landing_id TEXT NOT NULL,
  sessions BIGINT NOT NULL DEFAULT 0,
  engaged_sessions BIGINT NOT NULL DEFAULT 0,
  cta_conversions BIGINT NOT NULL DEFAULT 0,
  p75_load_ms INTEGER,
  PRIMARY KEY (report_date, landing_id)
);
CREATE TABLE monthly_targets (
  month_start DATE PRIMARY KEY,
  revenue_target_paise BIGINT NOT NULL CHECK (revenue_target_paise >= 0)
);

-- Student progress data is pseudonymous. The identity mapping must remain in a
-- separate, access-controlled student service; do not add names, emails, or DOBs here.
CREATE TABLE student_cohorts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE students (
  id TEXT PRIMARY KEY, -- pseudonymous student ID, e.g. ST-0101
  cohort_id TEXT NOT NULL REFERENCES student_cohorts(id),
  active_from DATE NOT NULL,
  active_to DATE,
  CHECK (active_to IS NULL OR active_to >= active_from)
);
CREATE TABLE activity_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','monthly','quarterly')),
  category TEXT NOT NULL CHECK (category IN ('engagement','learning','support','program')),
  captures_quality BOOLEAN NOT NULL DEFAULT FALSE,
  captures_outcome BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE student_activity_events (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  activity_id TEXT NOT NULL REFERENCES activity_catalog(id),
  planned_at DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned','completed','missed','cancelled')),
  completed_at TIMESTAMPTZ,
  pulse_rating SMALLINT CHECK (pulse_rating BETWEEN 1 AND 5),
  outcome_score NUMERIC(5,2) CHECK (outcome_score BETWEEN 0 AND 100),
  focus_minutes SMALLINT CHECK (focus_minutes >= 0),
  source_system TEXT NOT NULL,
  external_event_id TEXT,
  CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CHECK (status = 'completed' OR (pulse_rating IS NULL AND outcome_score IS NULL AND focus_minutes IS NULL)),
  UNIQUE (source_system, external_event_id)
);
CREATE INDEX idx_student_activity_date ON student_activity_events(planned_at, activity_id, status);
CREATE INDEX idx_student_activity_student_date ON student_activity_events(student_id, planned_at);
-- PII and consent data should be managed in a separate controlled student service.
