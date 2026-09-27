-- The decision ledger: append-only and hash-chained.
--
--   row_hash(n)  = sha256( prev_hash(n) || canonical_json(row n without seq and row_hash) )
--   prev_hash(n) = row_hash(n-1),  prev_hash(1) = 64 zeros
--
-- The service computes the hashes (so the verifier and the writer share one
-- canonical form) under a transaction-scoped advisory lock, so two writers can
-- never chain onto the same prev_hash. The database refuses every UPDATE,
-- DELETE and TRUNCATE. What this gives is tamper-EVIDENCE: a rewrite of any
-- row breaks the chain from that row on, and a rewrite of the whole chain is
-- exposed by the daily anchor published outside the database.

CREATE TABLE decision_ledger (
  seq             bigserial PRIMARY KEY,
  at              timestamptz NOT NULL,
  actor           text NOT NULL,
  actor_id        uuid,
  kind            text NOT NULL,
  application_id  text,
  approval_id     text,
  inputs          jsonb NOT NULL,
  outputs         jsonb NOT NULL,
  rules_version   text NOT NULL,
  engine_version  text NOT NULL,
  document_sha256 char(64),
  signature_ref   text,
  prev_hash       char(64) NOT NULL CHECK (prev_hash ~ '^[0-9a-f]{64}$'),
  row_hash        char(64) NOT NULL UNIQUE CHECK (row_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX ledger_by_file ON decision_ledger (application_id, seq);

CREATE FUNCTION decision_ledger_is_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'decision_ledger is append-only (% refused)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER decision_ledger_no_update
  BEFORE UPDATE OR DELETE ON decision_ledger
  FOR EACH ROW EXECUTE FUNCTION decision_ledger_is_append_only();

CREATE TRIGGER decision_ledger_no_truncate
  BEFORE TRUNCATE ON decision_ledger
  FOR EACH STATEMENT EXECUTE FUNCTION decision_ledger_is_append_only();

-- The head of each day, to be published where the database administrator
-- cannot reach it. A superuser who rewrites the whole chain cannot match
-- yesterday's published hash.
CREATE TABLE ledger_anchor (
  day          date PRIMARY KEY,
  head_seq     bigint NOT NULL,
  head_hash    char(64) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_to text
);

-- In production the service connects as a role that cannot even ask.
-- (Run once by a DBA: GRANT INSERT, SELECT ON decision_ledger TO anumati_app;
--  REVOKE UPDATE, DELETE, TRUNCATE ON decision_ledger FROM anumati_app;)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anumati_app') THEN
    EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON decision_ledger FROM anumati_app';
    EXECUTE 'GRANT SELECT, INSERT ON decision_ledger TO anumati_app';
    EXECUTE 'GRANT USAGE ON SEQUENCE decision_ledger_seq_seq TO anumati_app';
  END IF;
END $$;
