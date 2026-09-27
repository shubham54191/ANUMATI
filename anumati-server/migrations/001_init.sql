-- ANUMATI — initial schema.
-- PostgreSQL is the single source of truth: rules, applications, clocks,
-- documents, the ledger and (in its own schema) the job queue.

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE,
  password_hash text,                        -- null for MAITRI-federated accounts
  role          text NOT NULL CHECK (role IN ('applicant','officer','committee','reviewer','admin')),
  name          text NOT NULL,
  designation   text NOT NULL DEFAULT '',
  office        text NOT NULL DEFAULT '',
  -- For officers: the department whose desks this person may act on.
  -- 'single-window' is the facilitation desk: dispatches, never decides.
  department_id text,
  maitri_subject text UNIQUE,                -- the MAITRI 2.0 identity, when federated
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (role <> 'officer' OR department_id IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- The rule base: versioned, never edited, never without a citation
-- ---------------------------------------------------------------------------
CREATE TABLE source_document (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  url         text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rule_set (
  version      text PRIMARY KEY,               -- 'v1.3'
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid REFERENCES app_user(id),
  note         text NOT NULL DEFAULT '',
  is_current   boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX rule_set_one_current ON rule_set (is_current) WHERE is_current;

CREATE TABLE approval_version (
  approval_id        text NOT NULL,
  version            int  NOT NULL,
  name               text NOT NULL,
  department_id      text NOT NULL,
  statutory_days     int  NOT NULL CHECK (statutory_days >= 0),
  deemed_exists      boolean NOT NULL,
  deemed_days        int,
  deemed_reference   text,
  -- The whole approval as the engine reads it.
  body               jsonb NOT NULL,
  source_document_id text NOT NULL REFERENCES source_document(id),
  section            text NOT NULL CHECK (length(section) > 0),
  valid_from         date NOT NULL,
  valid_to           date,
  review_status      text NOT NULL CHECK (review_status IN ('draft','published','rejected','superseded')),
  -- Where a draft came from: page, extracted text, model, confidence.
  extraction         jsonb,
  created_by         uuid REFERENCES app_user(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  reviewed_by        uuid REFERENCES app_user(id),
  reviewed_at        timestamptz,
  review_note        text,
  PRIMARY KEY (approval_id, version),
  -- A deeming clause without the provision that grants it is refused.
  CHECK (NOT deemed_exists OR (deemed_days IS NOT NULL AND deemed_reference IS NOT NULL))
);
CREATE UNIQUE INDEX approval_one_published
  ON approval_version (approval_id) WHERE review_status = 'published';

CREATE TABLE dependency_version (
  id            bigserial PRIMARY KEY,
  from_approval text NOT NULL,
  to_approval   text NOT NULL,
  edge_type     text NOT NULL CHECK (edge_type IN ('statutory','documentary','physical','practice')),
  confidence    numeric NOT NULL CHECK (confidence > 0 AND confidence <= 1),
  rationale     text NOT NULL CHECK (length(rationale) > 0),
  body          jsonb NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('draft','published','rejected','superseded')),
  valid_from    date NOT NULL,
  valid_to      date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (from_approval <> to_approval)
);
CREATE INDEX dependency_published ON dependency_version (review_status);

-- ---------------------------------------------------------------------------
-- Roadmaps and applications
-- ---------------------------------------------------------------------------
CREATE TABLE roadmap (
  id             text PRIMARY KEY,
  owner_id       uuid REFERENCES app_user(id),
  request        jsonb NOT NULL,
  result         jsonb NOT NULL,
  rules_version  text NOT NULL,
  engine_version text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE application_seq START 200;

CREATE TABLE application (
  id             text PRIMARY KEY,           -- 'APP-2026-0148'
  owner_id       uuid REFERENCES app_user(id),
  roadmap_id     text REFERENCES roadmap(id),
  applicant_name text NOT NULL,
  project        text NOT NULL,
  sector         text NOT NULL,
  location       text NOT NULL,
  -- The common application form: filled once, reused by every department.
  common_form    jsonb NOT NULL DEFAULT '{}'::jsonb,
  dossier        jsonb NOT NULL DEFAULT '{"documents":[],"fields":[]}'::jsonb,
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','submitted','in_clearance','returned','completed')),
  rules_version  text NOT NULL,              -- pinned at filing, for the file's whole life
  engine_version text NOT NULL,
  filed_at       timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX application_owner ON application (owner_id);

-- The parallel-clearance file. `state` is the aggregate the shared engine
-- reads and writes; the tables after it are projections kept in step with it
-- inside the same transaction, for querying.
CREATE TABLE matrix_file (
  application_id   text PRIMARY KEY REFERENCES application(id),
  state            jsonb NOT NULL,
  version          int NOT NULL DEFAULT 1,
  dispatched_at    timestamptz,
  demo_offset_days int NOT NULL DEFAULT 0,
  settled          boolean NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_projection (
  application_id    text NOT NULL REFERENCES application(id),
  dept_id           text NOT NULL,
  department_id     text NOT NULL,           -- dept_id without the per-approval suffix
  approval_id       text NOT NULL,
  state             text NOT NULL,
  sla_days          int NOT NULL,
  deemed_days       int,
  dispatched_on_day int,
  paused_days       int NOT NULL DEFAULT 0,
  query_open        boolean NOT NULL DEFAULT false,
  sla_left          int,
  deemed_left       int,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, dept_id)
);
CREATE INDEX review_by_department ON review_projection (department_id, state);

-- The clock's own record. Elapsed time is derived from these, never stored.
CREATE TABLE sla_event (
  id             bigserial PRIMARY KEY,
  application_id text NOT NULL REFERENCES application(id),
  dept_id        text NOT NULL,
  approval_id    text NOT NULL,
  kind           text NOT NULL CHECK (kind IN (
                   'dispatched','query_raised','query_answered','decided',
                   'deemed','transferred','committee_decided','resubmitted')),
  day            int NOT NULL,
  at             timestamptz NOT NULL DEFAULT now(),
  actor          text NOT NULL,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX sla_event_file ON sla_event (application_id, dept_id);

CREATE TABLE parameter_projection (
  application_id  text NOT NULL REFERENCES application(id),
  group_id        text NOT NULL,
  owner_dept      text NOT NULL,
  verified_by     text,
  signature_ref   text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, group_id)
);

-- ---------------------------------------------------------------------------
-- Documents — content-addressed by SHA-256
-- ---------------------------------------------------------------------------
CREATE TABLE document (
  sha256         char(64) PRIMARY KEY CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size      bigint NOT NULL,
  mime           text NOT NULL,
  stored_path    text,                        -- local store (demo / pilot)
  repository_ref text,                        -- MAITRI 2.0 repository id (production)
  received_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE application_document (
  application_id text NOT NULL REFERENCES application(id),
  sha256         char(64) NOT NULL REFERENCES document(sha256),
  kind           text NOT NULL,              -- the name on the department's list
  original_name  text NOT NULL,
  source         text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','digilocker','issuer')),
  uploaded_by    uuid REFERENCES app_user(id),
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, sha256, kind)
);

-- ---------------------------------------------------------------------------
-- Grievances, notifications, signatures
-- ---------------------------------------------------------------------------
CREATE TABLE grievance (
  id             text PRIMARY KEY,
  application_id text NOT NULL REFERENCES application(id),
  approval_id    text NOT NULL,
  dept_short     text NOT NULL,
  reason         text NOT NULL CHECK (length(reason) >= 10),
  days_pending   int NOT NULL,
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  raised_by      uuid REFERENCES app_user(id),
  raised_at      timestamptz NOT NULL DEFAULT now(),
  resolved_by    uuid REFERENCES app_user(id),
  resolved_at    timestamptz,
  resolution     text
);

CREATE TABLE notification (
  id             bigserial PRIMARY KEY,
  dedupe_key     text UNIQUE,                -- one renewal alert per threshold, ever
  application_id text REFERENCES application(id),
  recipient_role text NOT NULL,
  recipient_user uuid REFERENCES app_user(id),
  channel        text NOT NULL DEFAULT 'maitri',
  kind           text NOT NULL,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  delivered_at   timestamptz,
  delivery_ref   text
);

CREATE TABLE signature (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  text NOT NULL REFERENCES application(id),
  approval_id     text NOT NULL,
  document_sha256 char(64) NOT NULL,
  officer_id      uuid REFERENCES app_user(id),
  mode            text NOT NULL CHECK (mode IN ('demo','dsc')),
  algorithm       text NOT NULL,
  cert_subject    text NOT NULL,
  cert_serial     text NOT NULL,
  signature_b64   text NOT NULL,
  signed_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Integrations — idempotency and the exceptions list
-- ---------------------------------------------------------------------------
CREATE TABLE integration_call (
  idempotency_key text PRIMARY KEY,
  adapter         text NOT NULL,
  request         jsonb NOT NULL,
  response        jsonb,
  status          text NOT NULL CHECK (status IN ('pending','succeeded','failed')),
  attempts        int NOT NULL DEFAULT 0,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration_exception (
  id             bigserial PRIMARY KEY,
  adapter        text NOT NULL,
  application_id text REFERENCES application(id),
  detail         text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  resolved_by    uuid REFERENCES app_user(id)
);
