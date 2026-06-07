-- GritCore Database Schema v1
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Orgs ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orgs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  sheets_used   INTEGER NOT NULL DEFAULT 0,
  sheets_limit  INTEGER NOT NULL DEFAULT 10,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'estimator' CHECK (role IN ('owner', 'admin', 'estimator', 'viewer')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_org_id_idx ON users(org_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- ─── Projects ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  phase         TEXT NOT NULL DEFAULT 'bid' CHECK (phase IN ('bid', 'active', 'rfi', 'complete', 'archived')),
  bid_due_date  DATE,
  location      TEXT,
  gcr_number    TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);

-- ─── Sheets ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sheets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sheet_number  TEXT,
  discipline    TEXT,
  revision      TEXT,
  file_url      TEXT NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,
  page_count    INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sheets_project_id_idx ON sheets(project_id);
CREATE INDEX IF NOT EXISTS sheets_org_id_idx ON sheets(org_id);

-- ─── AI Reviews ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id          UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  model_used        TEXT,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  critical_count    INTEGER NOT NULL DEFAULT 0,
  warning_count     INTEGER NOT NULL DEFAULT 0,
  info_count        INTEGER NOT NULL DEFAULT 0,
  passed_count      INTEGER NOT NULL DEFAULT 0,
  summary           TEXT,
  quantity_estimate JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ai_reviews_sheet_id_idx ON ai_reviews(sheet_id);
CREATE INDEX IF NOT EXISTS ai_reviews_org_id_idx ON ai_reviews(org_id);

-- ─── Issues ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS issues (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id            UUID NOT NULL REFERENCES ai_reviews(id) ON DELETE CASCADE,
  org_id               UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  severity             TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info', 'passed')),
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  code_ref             TEXT,
  grid_location        TEXT,
  dollar_risk_estimate NUMERIC(12,2),
  status               TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'wont_fix')),
  assigned_to          UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS issues_review_id_idx ON issues(review_id);
CREATE INDEX IF NOT EXISTS issues_org_id_idx ON issues(org_id);
CREATE INDEX IF NOT EXISTS issues_severity_idx ON issues(severity);

-- ─── Markups ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS markups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id    UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  issue_id    UUID REFERENCES issues(id) ON DELETE SET NULL,
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL DEFAULT 'box' CHECK (type IN ('box', 'arrow', 'circle', 'freehand', 'text')),
  color       TEXT NOT NULL DEFAULT '#ff6b2b',
  coords      JSONB NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS markups_sheet_id_idx ON markups(sheet_id);
CREATE INDEX IF NOT EXISTS markups_org_id_idx ON markups(org_id);

-- ─── RFIs ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rfis (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  rfi_number   TEXT NOT NULL,
  subject      TEXT NOT NULL,
  question     TEXT NOT NULL,
  answer       TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'answered', 'closed')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  issue_id     UUID REFERENCES issues(id) ON DELETE SET NULL,
  sheet_id     UUID REFERENCES sheets(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),
  answered_by  UUID REFERENCES users(id),
  due_date     DATE,
  submitted_at TIMESTAMPTZ,
  answered_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rfis_project_id_idx ON rfis(project_id);
CREATE INDEX IF NOT EXISTS rfis_org_id_idx ON rfis(org_id);

-- ─── Updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_sheets_updated_at BEFORE UPDATE ON sheets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_rfis_updated_at BEFORE UPDATE ON rfis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
