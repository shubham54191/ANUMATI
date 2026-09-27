import type { Queryable } from "../db";
import { conflict, notFound } from "../errors";
import { deemedRemaining, derive, slaRemaining } from "@/lib/matrix/engine";
import type { ApplicationFile, DeptReview, ReviewState } from "@/types/matrix";
import { departmentOf } from "../auth/guard";

export interface StoredFile {
  application_id: string;
  state: ApplicationFile;
  version: number;
  dispatched_at: Date | null;
  demo_offset_days: number;
  settled: boolean;
}

export async function loadFile(c: Queryable, id: string, forUpdate = false): Promise<StoredFile> {
  const { rows } = await c.query(
    `SELECT application_id, state, version, dispatched_at, demo_offset_days, settled
       FROM matrix_file WHERE application_id = $1 ${forUpdate ? "FOR UPDATE" : ""}`,
    [id],
  );
  if (!rows[0]) throw notFound(`File ${id}`);
  return rows[0] as StoredFile;
}

/**
 * Save a new version. `expected` is the version the command read; a mismatch
 * means another writer got there first (optimistic check on top of the row
 * lock, so a stale client is told rather than silently overwritten).
 */
export async function saveFile(
  c: Queryable,
  id: string,
  expected: number,
  state: ApplicationFile,
  patch: Partial<{ dispatched_at: Date; demo_offset_days: number }> = {},
): Promise<number> {
  const settled = Boolean(state.resolution) || derive(state).verdict === "cleared";
  const res = await c.query(
    `UPDATE matrix_file
        SET state = $3, version = version + 1, settled = $4, updated_at = now(),
            dispatched_at = COALESCE($5, dispatched_at),
            demo_offset_days = COALESCE($6, demo_offset_days)
      WHERE application_id = $1 AND version = $2
      RETURNING version`,
    [id, expected, JSON.stringify(state), settled, patch.dispatched_at ?? null, patch.demo_offset_days ?? null],
  );
  if (!res.rows[0]) throw conflict("The file changed while you were working on it. Reload and try again.");
  return res.rows[0].version as number;
}

const SLA_KIND: Partial<Record<ReviewState, string>> = {
  approved: "decided",
  rejected: "decided",
  deemed_approved: "deemed",
  transferred_to_committee: "transferred",
};

/**
 * Keep the query-side tables in step with the aggregate, and write one clock
 * event for every desk whose state moved. Runs in the command's transaction.
 */
export async function project(
  c: Queryable,
  before: ApplicationFile | null,
  after: ApplicationFile,
  actor: string,
): Promise<{ changes: { dept_id: string; approval_id: string; from: string | null; to: string }[] }> {
  const prev = new Map<string, DeptReview>((before?.reviews ?? []).map((r) => [r.dept_id, r]));
  const changes: { dept_id: string; approval_id: string; from: string | null; to: string }[] = [];

  for (const r of after.reviews) {
    const p = prev.get(r.dept_id);
    const running = r.state === "in_review" && after.dispatched;
    await c.query(
      `INSERT INTO review_projection
         (application_id, dept_id, department_id, approval_id, state, sla_days, deemed_days,
          dispatched_on_day, paused_days, query_open, sla_left, deemed_left, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
       ON CONFLICT (application_id, dept_id) DO UPDATE SET
         state = EXCLUDED.state, sla_days = EXCLUDED.sla_days, deemed_days = EXCLUDED.deemed_days,
         dispatched_on_day = EXCLUDED.dispatched_on_day, paused_days = EXCLUDED.paused_days,
         query_open = EXCLUDED.query_open, sla_left = EXCLUDED.sla_left,
         deemed_left = EXCLUDED.deemed_left, updated_at = now()`,
      [
        after.id,
        r.dept_id,
        departmentOf(r.dept_id),
        r.approval_id,
        r.state,
        r.sla_days,
        r.deemed_days,
        r.dispatched_on_day ?? null,
        r.paused_days ?? 0,
        Boolean(r.query_open),
        running ? slaRemaining(r, after.day) : null,
        running ? deemedRemaining(r, after.day) : null,
      ],
    );

    const events: { kind: string; payload: object }[] = [];
    if (!p || p.state === "queued") {
      if (r.state === "in_review") events.push({ kind: "dispatched", payload: { sla_days: r.sla_days } });
    }
    if (p && p.state !== r.state && SLA_KIND[r.state]) {
      events.push({
        kind: p.state === "transferred_to_committee" ? "committee_decided" : (SLA_KIND[r.state] as string),
        payload: { from: p.state, to: r.state, remarks: r.remarks },
      });
    }
    if (p && p.state === "rejected" && r.state === "in_review") {
      events.push({ kind: "resubmitted", payload: {} });
    }
    if (p && !p.query_open && r.query_open) events.push({ kind: "query_raised", payload: {} });
    if (p && p.query_open && !r.query_open) events.push({ kind: "query_answered", payload: {} });

    for (const e of events) {
      await c.query(
        `INSERT INTO sla_event (application_id, dept_id, approval_id, kind, day, actor, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [after.id, r.dept_id, r.approval_id, e.kind, after.day, actor, JSON.stringify(e.payload)],
      );
    }
    if (!p || p.state !== r.state) {
      changes.push({ dept_id: r.dept_id, approval_id: r.approval_id, from: p?.state ?? null, to: r.state });
    }
  }

  for (const g of after.parameters) {
    await c.query(
      `INSERT INTO parameter_projection (application_id, group_id, owner_dept, verified_by, signature_ref, updated_at)
       VALUES ($1,$2,$3,$4,$5, now())
       ON CONFLICT (application_id, group_id) DO UPDATE SET
         verified_by = EXCLUDED.verified_by, signature_ref = EXCLUDED.signature_ref, updated_at = now()`,
      [after.id, g.id, g.owner_dept, g.verified_by_dept, g.signature_ref],
    );
  }
  return { changes };
}

/** A compact, stable summary of what a command did — what the ledger records. */
export function outcomeOf(before: ApplicationFile, after: ApplicationFile, changes: { dept_id: string; from: string | null; to: string }[]) {
  const newEvents = after.events.slice(before.events.length).map((e) => ({
    kind: e.kind,
    actor: e.actor,
    body: e.body,
    authority: e.authority ?? null,
  }));
  return {
    day: after.day,
    review_changes: changes,
    resolution: after.resolution ? { kind: after.resolution.kind, note: after.resolution.note } : null,
    verdict: derive(after).verdict,
    events: newEvents,
  };
}
