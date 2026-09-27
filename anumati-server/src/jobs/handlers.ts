import type { Ctx } from "../context";
import { systemPrincipal } from "../context";
import { appendLedger, anchorToday } from "../ledger/ledger";
import { idempotent } from "../adapters/resilience";
import { runCommand } from "../matrix/service";
import { loadFile } from "../matrix/store";
import { renewalBoard } from "@/lib/compliance/renewals";
import { SEED_RENEWALS } from "@/lib/data/renewals";
import type { ApplicationFile } from "@/types/matrix";

const DAY_MS = 86_400_000;

/** The file's day, from the wall clock — plus any days a demo has advanced it. */
export function dayOf(dispatchedAt: Date | null, demoOffsetDays: number, now = Date.now()): number {
  if (!dispatchedAt) return 0;
  return Math.floor((now - dispatchedAt.getTime()) / DAY_MS) + demoOffsetDays;
}

/**
 * The SLA Sentinel. Every minute: for each dispatched, unsettled file, bring
 * its day up to the wall clock. The shared engine's tick does the rest —
 * warnings, transfers under s. 5, deemed approvals under the parent Act — one
 * day at a time, exactly as the console simulation does.
 */
export async function slaSentinel(ctx: Ctx, now = Date.now()) {
  const { rows } = await ctx.pool.query(
    `SELECT application_id, dispatched_at, demo_offset_days, (state->>'day')::int AS day
       FROM matrix_file WHERE dispatched_at IS NOT NULL AND NOT settled`,
  );
  const moved: { id: string; from: number; to: number }[] = [];
  for (const r of rows) {
    const target = dayOf(r.dispatched_at, r.demo_offset_days, now);
    if (target > r.day) {
      await runCommand(ctx, r.application_id, { type: "advance_days", days: Math.min(400, target - r.day) }, systemPrincipal("sla-sentinel"));
      moved.push({ id: r.application_id, from: r.day, to: target });
    }
  }
  return moved;
}

/** Deliver one desk its file through the department adapter. */
export async function deliverToDepartment(
  ctx: Ctx,
  data: { application_id: string; dept_id: string; department_id: string; approval_id: string; day: number },
) {
  const key = `deliver:${data.application_id}:${data.dept_id}:${data.day}`;
  const receipt = await idempotent(ctx.pool, "department", key, data, () =>
    ctx.adapters.deliver(data.department_id, {
      application_id: data.application_id,
      approval_id: data.approval_id,
      desk: data.dept_id,
    }),
  );
  const { rows } = await ctx.pool.query("SELECT rules_version, engine_version FROM application WHERE id = $1", [data.application_id]);
  const client = await ctx.pool.connect();
  try {
    await client.query("BEGIN");
    await appendLedger(client, {
      actor: "integration-worker",
      kind: "integration.delivered",
      application_id: data.application_id,
      approval_id: data.approval_id,
      inputs: { desk: data.dept_id, channel: receipt.channel },
      outputs: { receipt: receipt.receipt },
      rules_version: rows[0]?.rules_version ?? ctx.cfg.RULES_VERSION,
      engine_version: rows[0]?.engine_version ?? ctx.cfg.ENGINE_VERSION,
    });
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return receipt;
}

/** Ask the registries for every record on the file that has no answer yet. */
export async function fetchRegistryRecords(ctx: Ctx, data: { application_id: string }) {
  const stored = await loadFile(ctx.pool, data.application_id);
  const file = stored.state as ApplicationFile;
  const worker = systemPrincipal("integration-worker");
  const results: { id: string; state: string }[] = [];
  for (const rec of file.records) {
    if (rec.state === "verified" || rec.state === "mismatch") continue;
    let answer: { state: "verified" | "mismatch" | "unavailable"; value: string };
    try {
      answer = await idempotent(
        ctx.pool,
        "api-setu",
        `registry:${data.application_id}:${rec.id}`,
        { record: rec.id },
        () => ctx.adapters.registry(rec.id, data.application_id),
      );
    } catch (e) {
      answer = { state: "unavailable", value: (e as Error).message };
    }
    await runCommand(
      ctx,
      data.application_id,
      { type: "set_record", record_id: rec.id, state: answer.state, value: answer.value },
      worker,
    );
    results.push({ id: rec.id, state: answer.state });
  }
  return results;
}

/** Status changes back to the applicant, through MAITRI's channel. */
export async function notifyMaitri(ctx: Ctx, data: { application_id: string; kind: string; body: string }) {
  const { rows } = await ctx.pool.query("SELECT owner_id FROM application WHERE id = $1", [data.application_id]);
  const sent = await ctx.adapters.notify(data);
  await ctx.pool.query(
    `INSERT INTO notification (application_id, recipient_role, recipient_user, kind, body, delivered_at, delivery_ref)
     VALUES ($1,'applicant',$2,$3,$4, now(), $5)`,
    [data.application_id, rows[0]?.owner_id ?? null, data.kind, data.body, sent.ref],
  );
  return sent;
}

/**
 * Renewal alerts at 60, 30 and 7 days, once each. The pilot board is the
 * seeded unit's licences; a deployment reads issued approvals instead.
 */
export async function renewalAlerts(ctx: Ctx, today = new Date()) {
  const board = renewalBoard(SEED_RENEWALS, today).filter((s) => s.alert !== "none");
  const owner = await ctx.pool.query("SELECT id FROM app_user WHERE username = 'applicant'");
  let sent = 0;
  for (const s of board) {
    const key = `renewal:${s.renewal.approval_id}:${s.renewal.valid_until}:${s.alert}`;
    const body =
      s.alert === "expired"
        ? `${s.renewal.name} (${s.renewal.department_short}) expired on ${s.renewal.valid_until}. Operating without it is unlawful — renew now.`
        : `${s.renewal.name} (${s.renewal.department_short}) expires on ${s.renewal.valid_until} — ${s.days_left} day(s) left. ${s.window_open ? "The renewal window is open." : ""}`;
    const res = await ctx.pool.query(
      `INSERT INTO notification (dedupe_key, recipient_role, recipient_user, kind, body)
       VALUES ($1,'applicant',$2,'renewal',$3) ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`,
      [key, owner.rows[0]?.id ?? null, body],
    );
    if (res.rowCount) {
      const ref = await ctx.adapters.notify({ application_id: "-", kind: "renewal", body });
      await ctx.pool.query("UPDATE notification SET delivered_at = now(), delivery_ref = $2 WHERE id = $1", [res.rows[0].id, ref.ref]);
      sent += 1;
    }
  }
  return { due: board.length, sent };
}

export async function dailyAnchor(ctx: Ctx) {
  return anchorToday(ctx.pool, "Daily head hash — to be mailed, signed, to the Supervisory Committee secretariat");
}

/** A job that exhausted its retries lands on the officer's exceptions list. */
export async function deadLetter(ctx: Ctx, job: { name?: string; data: Record<string, unknown> }) {
  await ctx.pool.query(
    "INSERT INTO integration_exception (adapter, application_id, detail) VALUES ($1,$2,$3)",
    [
      String(job.name ?? "integration"),
      (job.data?.application_id as string | undefined) ?? null,
      `Gave up after retries: ${JSON.stringify(job.data).slice(0, 500)}`,
    ],
  );
}
