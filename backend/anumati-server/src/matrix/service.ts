import type { Client } from "../db";
import { tx } from "../db";
import type { Ctx } from "../context";
import type { Principal } from "../auth/tokens";
import { departmentOf } from "../auth/guard";
import { appendLedger } from "../ledger/ledger";
import { applyCommand, canView, type Command } from "./commands";
import { loadFile, outcomeOf, project, saveFile } from "./store";
import { deemedRemaining, derive, dispatchWave, slaRemaining } from "@/lib/matrix/engine";
import type { ApplicationFile } from "@/types/matrix";
import type { Roadmap } from "@/types/roadmap";
import type { Dossier } from "@/types/compliance";
import { desksForWave, nextWave, parametersForDesks } from "../engine/bridge";
import { forbidden, notFound } from "../errors";
import { QUEUES, sendInTx } from "../jobs/queues";

export interface FileView {
  file: ApplicationFile;
  derived: ReturnType<typeof derive>;
  version: number;
  clocks: Record<string, { sla_left: number | null; deemed_left: number | null; paused_days: number; query_open: boolean }>;
  linked_roadmap: string | null;
  demo_controls: boolean;
}

export function view(file: ApplicationFile, version: number, roadmapId: string | null, demo: boolean): FileView {
  const clocks: FileView["clocks"] = {};
  for (const r of file.reviews) {
    const running = r.state === "in_review" && file.dispatched;
    clocks[r.dept_id] = {
      sla_left: running ? slaRemaining(r, file.day) : null,
      deemed_left: running || r.state === "transferred_to_committee" ? deemedRemaining(r, file.day) : null,
      paused_days: r.paused_days ?? 0,
      query_open: Boolean(r.query_open),
    };
  }
  return { file, derived: derive(file), version, clocks, linked_roadmap: roadmapId, demo_controls: demo };
}

async function meta(c: Client, id: string) {
  const { rows } = await c.query(
    `SELECT a.owner_id, a.roadmap_id, a.rules_version, a.engine_version, a.dossier, r.result AS roadmap
       FROM application a LEFT JOIN roadmap r ON r.id = a.roadmap_id WHERE a.id = $1`,
    [id],
  );
  if (!rows[0]) throw notFound(`Application ${id}`);
  return rows[0] as {
    owner_id: string | null;
    roadmap_id: string | null;
    rules_version: string;
    engine_version: string;
    dossier: Dossier;
    roadmap: Roadmap | null;
  };
}

/**
 * Release whatever the roadmap now allows. Only for files that came from a
 * roadmap; the scripted demo files have a fixed set of desks.
 */
function releaseWaves(file: ApplicationFile, roadmap: Roadmap | null, dossier: Dossier): ApplicationFile {
  if (!roadmap || file.resolution || !file.dispatched) return file;
  const issued = new Set(
    file.reviews.filter((r) => r.state === "approved" || r.state === "deemed_approved").map((r) => r.approval_id),
  );
  const onFile = new Set(file.reviews.map((r) => r.approval_id));
  const wave = nextWave(roadmap, issued, onFile);
  if (wave.length === 0) return file;
  const desks = desksForWave(wave);
  const next = dispatchWave(file, desks);
  const waveNo = new Set(next.reviews.map((r) => r.dispatched_on_day ?? 0)).size;
  return {
    ...next,
    phase: `Wave ${waveNo} — approvals whose prerequisites are now issued`,
    parameters: [...next.parameters, ...parametersForDesks(desks, dossier)],
  };
}

/**
 * The only write path for a file. One transaction: lock the row, check the
 * principal, apply the shared engine, release any wave the decision unlocked,
 * save, update projections, append the ledger row, enqueue the jobs the change
 * implies, and notify listeners — all of it or none of it.
 */
export async function runCommand(
  ctx: Ctx,
  fileId: string,
  cmd: Command,
  principal: Principal,
): Promise<FileView> {
  return tx(ctx.pool, (c) => commandInTx(ctx, c, fileId, cmd, principal));
}

/** The same, inside a transaction the caller already holds. */
export async function commandInTx(
  ctx: Ctx,
  c: Client,
  fileId: string,
  cmd: Command,
  principal: Principal,
): Promise<FileView> {
  {
    const stored = await loadFile(c, fileId, true);
    const m = await meta(c, fileId);
    const before = stored.state;

    let after = applyCommand(before, cmd, {
      principal,
      ownerId: m.owner_id,
      demoMode: ctx.cfg.DEMO_MODE,
    });
    after = releaseWaves(after, m.roadmap, m.dossier);

    const patch: { dispatched_at?: Date; demo_offset_days?: number } = {};
    if (!before.dispatched && after.dispatched) patch.dispatched_at = new Date();
    if (cmd.type === "advance_days" && !principal.service) {
      patch.demo_offset_days = stored.demo_offset_days + cmd.days;
    }

    const version = after === before && cmd.type !== "fetch_records"
      ? stored.version
      : await saveFile(c, fileId, stored.version, after, patch);

    const { changes } = await project(c, before, after, principal.username);

    // Jobs the change implies.
    const newlyRunning = after.reviews.filter(
      (r) => r.state === "in_review" && before.reviews.find((b) => b.dept_id === r.dept_id)?.state !== "in_review",
    );
    for (const r of newlyRunning) {
      await sendInTx(ctx.boss, c, QUEUES.deliver, {
        application_id: fileId,
        dept_id: r.dept_id,
        department_id: departmentOf(r.dept_id),
        approval_id: r.approval_id,
        day: after.day,
      }, { singletonKey: `${fileId}:${r.dept_id}:${after.day}` });
    }
    if (cmd.type === "fetch_records" || (!before.dispatched && after.dispatched)) {
      await sendInTx(ctx.boss, c, QUEUES.records, { application_id: fileId });
    }
    for (const ch of changes) {
      if (ch.to === "transferred_to_committee" || ch.to === "deemed_approved" || (ch.to === "approved" && ch.from)) {
        await sendInTx(ctx.boss, c, QUEUES.notify, {
          application_id: fileId,
          kind: ch.to,
          body: `${ch.approval_id}: ${ch.from ?? "new"} → ${ch.to}`,
        });
      }
    }

    // Status of the application follows the file.
    const d = derive(after);
    const status =
      after.resolution?.kind === "sent_for_revision" || after.resolution?.kind === "sustained" || after.resolution?.kind === "failed_score"
        ? "returned"
        : after.resolution?.kind === "cleared" || after.resolution?.kind === "overruled"
          ? "completed"
          : after.dispatched
            ? "in_clearance"
            : "submitted";
    await c.query("UPDATE application SET status = $2, updated_at = now() WHERE id = $1", [fileId, status]);

    if (after !== before || cmd.type === "fetch_records") {
      const changedDesk = "dept_id" in cmd ? after.reviews.find((r) => r.dept_id === cmd.dept_id) : null;
      await appendLedger(c, {
        actor: principal.username,
        actor_id: principal.service ? null : principal.id,
        kind: `matrix.${cmd.type}`,
        application_id: fileId,
        approval_id: changedDesk?.approval_id ?? null,
        inputs: sanitize(cmd),
        outputs: outcomeOf(before, after, changes),
        rules_version: m.rules_version,
        engine_version: m.engine_version,
      });
      await c.query("SELECT pg_notify('anumati_events', $1)", [
        JSON.stringify({ application_id: fileId, version, verdict: d.verdict }),
      ]);
    }

    return view(after, version, m.roadmap_id, ctx.cfg.DEMO_MODE);
  }
}

/** The ledger keeps what was asked, minus nothing — commands carry no secrets. */
function sanitize(cmd: Command) {
  return { ...cmd };
}

export async function readFileFor(ctx: Ctx, id: string, principal: Principal): Promise<FileView> {
  const stored = await loadFile(ctx.pool, id);
  const { rows } = await ctx.pool.query("SELECT owner_id, roadmap_id FROM application WHERE id = $1", [id]);
  if (!canView(principal, stored.state, rows[0]?.owner_id ?? null)) {
    throw forbidden("This file is not on your desk.");
  }
  return view(stored.state, stored.version, rows[0]?.roadmap_id ?? null, ctx.cfg.DEMO_MODE);
}

/** Files this principal may see, newest first, with the headline numbers. */
export async function listFiles(ctx: Ctx, p: Principal) {
  const { rows } = await ctx.pool.query(
    `SELECT a.id, a.owner_id, a.applicant_name, a.project, a.status, a.roadmap_id, m.state, m.version, m.updated_at
       FROM matrix_file m JOIN application a ON a.id = m.application_id
      ORDER BY a.filed_at DESC NULLS LAST, a.id`,
  );
  return rows
    .filter((r) => canView(p, r.state as ApplicationFile, r.owner_id))
    .map((r) => {
      const file = r.state as ApplicationFile;
      const d = derive(file);
      return {
        id: file.id,
        applicant: file.applicant,
        project: file.project,
        status: r.status,
        day: file.day,
        dispatched: file.dispatched,
        verdict: d.verdict,
        desks: file.reviews.length,
        pending: d.pending.length,
        conflict: d.conflict,
        breached: d.breachedSla.length,
        transferred: d.transferred.length,
        linked_roadmap: r.roadmap_id,
        version: r.version,
        updated_at: r.updated_at,
      };
    });
}
