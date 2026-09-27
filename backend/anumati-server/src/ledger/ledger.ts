import { createHash } from "node:crypto";
import type { Pool, Queryable } from "../db";

export const GENESIS = "0".repeat(64);

/**
 * Canonical JSON: object keys sorted at every depth, no whitespace, undefined
 * dropped. The writer and the verifier both hash this form, so a row read back
 * from the database hashes to exactly what was written.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) {
    return `[${value.map((v) => (v === undefined ? "null" : canonicalJson(v))).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export interface LedgerEntry {
  actor: string;
  actor_id?: string | null;
  kind: string;
  application_id?: string | null;
  approval_id?: string | null;
  inputs: unknown;
  outputs: unknown;
  rules_version: string;
  engine_version: string;
  document_sha256?: string | null;
  signature_ref?: string | null;
}

export interface LedgerRow extends Required<Omit<LedgerEntry, "inputs" | "outputs">> {
  seq: number;
  at: string;
  inputs: unknown;
  outputs: unknown;
  prev_hash: string;
  row_hash: string;
}

/** The part of a row the hash covers: everything except seq and row_hash. */
function hashable(row: Omit<LedgerRow, "seq" | "row_hash">) {
  return {
    at: row.at,
    actor: row.actor,
    actor_id: row.actor_id,
    kind: row.kind,
    application_id: row.application_id,
    approval_id: row.approval_id,
    inputs: row.inputs,
    outputs: row.outputs,
    rules_version: row.rules_version,
    engine_version: row.engine_version,
    document_sha256: row.document_sha256,
    signature_ref: row.signature_ref,
    prev_hash: row.prev_hash,
  };
}

export function rowHash(row: Omit<LedgerRow, "seq" | "row_hash">): string {
  return createHash("sha256")
    .update(row.prev_hash)
    .update(canonicalJson(hashable(row)))
    .digest("hex");
}

/**
 * Append one row. Must run inside the caller's transaction: the advisory lock
 * is transaction-scoped, so the whole command — state change and its record —
 * is serialised against every other writer.
 */
export async function appendLedger(c: Queryable, entry: LedgerEntry): Promise<LedgerRow> {
  await c.query("SELECT pg_advisory_xact_lock(hashtext('decision_ledger'))");
  const head = await c.query<{ row_hash: string }>(
    "SELECT row_hash FROM decision_ledger ORDER BY seq DESC LIMIT 1",
  );
  // Round-trip the JSON first, so what is hashed is exactly what jsonb will
  // hand back (no undefined, no class instances).
  const inputs = JSON.parse(JSON.stringify(entry.inputs ?? {}));
  const outputs = JSON.parse(JSON.stringify(entry.outputs ?? {}));
  const base = {
    at: new Date().toISOString(),
    actor: entry.actor,
    actor_id: entry.actor_id ?? null,
    kind: entry.kind,
    application_id: entry.application_id ?? null,
    approval_id: entry.approval_id ?? null,
    inputs,
    outputs,
    rules_version: entry.rules_version,
    engine_version: entry.engine_version,
    document_sha256: entry.document_sha256 ?? null,
    signature_ref: entry.signature_ref ?? null,
    prev_hash: head.rows[0]?.row_hash ?? GENESIS,
  };
  const row_hash = rowHash(base);
  const res = await c.query<{ seq: number }>(
    `INSERT INTO decision_ledger
       (at, actor, actor_id, kind, application_id, approval_id, inputs, outputs,
        rules_version, engine_version, document_sha256, signature_ref, prev_hash, row_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING seq`,
    [
      base.at, base.actor, base.actor_id, base.kind, base.application_id, base.approval_id,
      JSON.stringify(base.inputs), JSON.stringify(base.outputs), base.rules_version,
      base.engine_version, base.document_sha256, base.signature_ref, base.prev_hash, row_hash,
    ],
  );
  return { ...base, seq: res.rows[0].seq, row_hash } as LedgerRow;
}

function fromDb(r: Record<string, unknown>): LedgerRow {
  return {
    seq: r.seq as number,
    at: (r.at as Date).toISOString(),
    actor: r.actor as string,
    actor_id: (r.actor_id as string | null) ?? null,
    kind: r.kind as string,
    application_id: (r.application_id as string | null) ?? null,
    approval_id: (r.approval_id as string | null) ?? null,
    inputs: r.inputs,
    outputs: r.outputs,
    rules_version: r.rules_version as string,
    engine_version: r.engine_version as string,
    document_sha256: (r.document_sha256 as string | null) ?? null,
    signature_ref: (r.signature_ref as string | null) ?? null,
    prev_hash: r.prev_hash as string,
    row_hash: r.row_hash as string,
  };
}

export interface VerifyResult {
  ok: boolean;
  checked: number;
  head: { seq: number; hash: string } | null;
  first_break: null | {
    seq: number;
    reason: "prev_hash_mismatch" | "row_hash_mismatch";
    expected: string;
    found: string;
  };
  anchors: { day: string; ok: boolean }[];
}

/**
 * Walk the chain from the first row, recomputing every hash. Reports the
 * first row that does not match, and whether each published daily anchor is
 * still the hash at that position.
 */
export async function verifyLedger(pool: Pool, batch = 2000): Promise<VerifyResult> {
  let prev = GENESIS;
  let checked = 0;
  let last: LedgerRow | null = null;
  let after = 0;
  const bySeq = new Map<number, string>();
  for (;;) {
    const { rows } = await pool.query(
      "SELECT * FROM decision_ledger WHERE seq > $1 ORDER BY seq LIMIT $2",
      [after, batch],
    );
    if (rows.length === 0) break;
    for (const raw of rows) {
      const row = fromDb(raw);
      if (row.prev_hash !== prev) {
        return {
          ok: false,
          checked,
          head: last ? { seq: last.seq, hash: last.row_hash } : null,
          first_break: { seq: row.seq, reason: "prev_hash_mismatch", expected: prev, found: row.prev_hash },
          anchors: [],
        };
      }
      const expected = rowHash(row);
      if (expected !== row.row_hash) {
        return {
          ok: false,
          checked,
          head: last ? { seq: last.seq, hash: last.row_hash } : null,
          first_break: { seq: row.seq, reason: "row_hash_mismatch", expected, found: row.row_hash },
          anchors: [],
        };
      }
      bySeq.set(row.seq, row.row_hash);
      prev = row.row_hash;
      last = row;
      checked += 1;
      after = row.seq;
    }
  }
  const anchorRows = (
    await pool.query("SELECT day, head_seq, head_hash FROM ledger_anchor ORDER BY day")
  ).rows as { day: Date; head_seq: number; head_hash: string }[];
  const anchors = anchorRows.map((a) => ({
    day: a.day.toISOString().slice(0, 10),
    ok: bySeq.get(a.head_seq) === a.head_hash,
  }));
  return {
    ok: anchors.every((a) => a.ok),
    checked,
    head: last ? { seq: last.seq, hash: last.row_hash } : null,
    first_break: null,
    anchors,
  };
}

/** Record today's head, to be published outside the database. */
export async function anchorToday(pool: Pool, publishedTo: string | null = null) {
  const head = await pool.query<{ seq: number; row_hash: string }>(
    "SELECT seq, row_hash FROM decision_ledger ORDER BY seq DESC LIMIT 1",
  );
  if (!head.rows[0]) return null;
  const day = new Date().toISOString().slice(0, 10);
  await pool.query(
    `INSERT INTO ledger_anchor (day, head_seq, head_hash, published_to) VALUES ($1,$2,$3,$4)
     ON CONFLICT (day) DO UPDATE SET head_seq = EXCLUDED.head_seq, head_hash = EXCLUDED.head_hash,
       published_to = EXCLUDED.published_to, created_at = now()`,
    [day, head.rows[0].seq, head.rows[0].row_hash, publishedTo],
  );
  return { day, head_seq: head.rows[0].seq, head_hash: head.rows[0].row_hash };
}

export async function ledgerFor(pool: Pool, applicationId: string | null, limit = 200) {
  const { rows } = await pool.query(
    applicationId
      ? "SELECT * FROM decision_ledger WHERE application_id = $1 ORDER BY seq DESC LIMIT $2"
      : "SELECT * FROM decision_ledger ORDER BY seq DESC LIMIT $1",
    applicationId ? [applicationId, limit] : [limit],
  );
  return rows.map(fromDb);
}
