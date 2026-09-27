import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Ctx } from "../context";
import { need, needRole } from "../auth/guard";
import { tx } from "../db";
import { forbidden, notFound, unprocessable } from "../errors";
import { appendLedger } from "../ledger/ledger";
import { derive, isOpen } from "@/lib/matrix/engine";
import type { ApplicationFile } from "@/types/matrix";
import { QUEUES, sendInTx } from "../jobs/queues";

export async function committeeRoutes(app: FastifyInstance, ctx: Ctx) {
  /**
   * Everything that has reached the Empowered Committee, and why: a desk that
   * lapsed (s. 5), a deadlock routed to it, a grievance (s. 8(1)(g)), and —
   * for its review power under s. 8(1)(c) — desks past their limit that have
   * not yet been transferred.
   */
  app.get("/v1/committee/queue", async (req) => {
    needRole(req, "committee");
    const files = await ctx.pool.query(
      "SELECT m.state, a.owner_id FROM matrix_file m JOIN application a ON a.id = m.application_id",
    );
    const items: Record<string, unknown>[] = [];
    for (const row of files.rows) {
      const f = row.state as ApplicationFile;
      const d = derive(f);
      for (const r of d.transferred) {
        items.push({
          kind: "transferred",
          application_id: f.id,
          applicant: f.applicant,
          dept_id: r.dept_id,
          dept_short: r.dept_short,
          approval_id: r.approval_id,
          approval_name: r.approval_name,
          since_day: r.escalated_on_day,
          day: f.day,
          detail: `${r.dept_short} missed its ${r.sla_days}-day limit. The Committee disposes of it under the relevant law.`,
          authority: "MAITRI Act, 2023 — s. 5",
        });
      }
      if (f.tie_breaker_open) {
        items.push({
          kind: "tie_breaker",
          application_id: f.id,
          applicant: f.applicant,
          day: f.day,
          detail: `${d.approved.map((r) => r.dept_short).join(", ")} approved while ${d.rejected.map((r) => r.dept_short).join(", ")} rejected. Equal authority — the Committee decides.`,
          authority: `${f.rule.authority} — ${f.rule.authority_section}`,
        });
      }
      for (const r of d.breachedSla.filter((x) => isOpen(x) && x.state === "in_review")) {
        items.push({
          kind: "overdue",
          application_id: f.id,
          applicant: f.applicant,
          dept_id: r.dept_id,
          dept_short: r.dept_short,
          approval_id: r.approval_id,
          approval_name: r.approval_name,
          day: f.day,
          detail: `${r.dept_short} is past its limit on ${r.approval_id}.`,
          authority: "MAITRI Act, 2023 — s. 8(1)(c)",
        });
      }
    }
    const g = await ctx.pool.query("SELECT * FROM grievance WHERE status <> 'resolved' ORDER BY raised_at");
    for (const gr of g.rows) {
      items.push({
        kind: "grievance",
        grievance_id: gr.id,
        application_id: gr.application_id,
        approval_id: gr.approval_id,
        dept_short: gr.dept_short,
        detail: gr.reason,
        days_pending: gr.days_pending,
        status: gr.status,
        raised_at: gr.raised_at,
        authority: "MAITRI Act, 2023 — s. 8(1)(g)",
      });
    }
    const order = { tie_breaker: 0, transferred: 1, grievance: 2, overdue: 3 } as Record<string, number>;
    items.sort((a, b) => order[a.kind as string] - order[b.kind as string]);
    return { data: items };
  });

  const Raise = z.object({
    application_id: z.string(),
    approval_id: z.string(),
    reason: z.string().trim().min(10).max(2000),
  });

  /** One button on any stuck approval. The grievance leaves the department. */
  app.post("/v1/grievances", async (req, reply) => {
    const p = needRole(req, "applicant");
    const body = Raise.parse(req.body);
    const out = await tx(ctx.pool, async (c) => {
      const { rows } = await c.query(
        `SELECT a.owner_id, a.rules_version, a.engine_version, m.state FROM application a
           JOIN matrix_file m ON m.application_id = a.id WHERE a.id = $1`,
        [body.application_id],
      );
      if (!rows[0]) throw notFound(`File ${body.application_id}`);
      if (rows[0].owner_id !== p.id) throw forbidden("This file is not yours.");
      const f = rows[0].state as ApplicationFile;
      const desk = f.reviews.find((r) => r.approval_id === body.approval_id);
      if (!desk) throw unprocessable(`${body.approval_id} is not on this file.`);
      if (!isOpen(desk)) throw unprocessable(`${body.approval_id} is already decided (${desk.state}).`);
      const id = `GRV-${randomBytes(4).toString("hex").toUpperCase()}`;
      const daysPending = Math.max(0, f.day - (desk.dispatched_on_day ?? 0));
      await c.query(
        `INSERT INTO grievance (id, application_id, approval_id, dept_short, reason, days_pending, raised_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, body.application_id, body.approval_id, desk.dept_short, body.reason, daysPending, p.id],
      );
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "grievance.raised",
        application_id: body.application_id,
        approval_id: body.approval_id,
        inputs: { reason: body.reason },
        outputs: { grievance_id: id, route: "Empowered Committee — MAITRI Act, 2023 s. 8(1)(g)", days_pending: daysPending },
        rules_version: rows[0].rules_version,
        engine_version: rows[0].engine_version,
      });
      await sendInTx(ctx.boss, c, QUEUES.notify, {
        application_id: body.application_id,
        kind: "grievance",
        body: `Grievance ${id} on ${body.approval_id} sent to the Empowered Committee.`,
      });
      return { id, route: "Empowered Committee", authority: "MAITRI Act, 2023 — s. 8(1)(g)" };
    });
    reply.status(201);
    return out;
  });

  app.get("/v1/grievances", async (req) => {
    const p = need(req);
    const { rows } = await ctx.pool.query(
      p.role === "applicant"
        ? "SELECT g.* FROM grievance g JOIN application a ON a.id = g.application_id WHERE a.owner_id = $1 ORDER BY raised_at DESC"
        : "SELECT * FROM grievance ORDER BY raised_at DESC",
      p.role === "applicant" ? [p.id] : [],
    );
    if (!["applicant", "committee", "admin"].includes(p.role) && p.department_id !== "single-window") {
      throw forbidden("Grievances are seen by the applicant, the facilitation desk and the Committee.");
    }
    return { data: rows };
  });

  app.post("/v1/grievances/:id/resolve", async (req) => {
    const p = needRole(req, "committee");
    const { resolution } = z.object({ resolution: z.string().trim().min(5).max(2000) }).parse(req.body);
    const id = (req.params as { id: string }).id;
    return tx(ctx.pool, async (c) => {
      const { rows } = await c.query(
        `UPDATE grievance SET status = 'resolved', resolved_by = $2, resolved_at = now(), resolution = $3
          WHERE id = $1 AND status <> 'resolved' RETURNING *`,
        [id, p.id, resolution],
      );
      if (!rows[0]) throw notFound(`Open grievance ${id}`);
      const a = await c.query("SELECT rules_version, engine_version FROM application WHERE id = $1", [rows[0].application_id]);
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "grievance.resolved",
        application_id: rows[0].application_id,
        approval_id: rows[0].approval_id,
        inputs: { grievance_id: id },
        outputs: { resolution },
        rules_version: a.rows[0].rules_version,
        engine_version: a.rows[0].engine_version,
      });
      await sendInTx(ctx.boss, c, QUEUES.notify, {
        application_id: rows[0].application_id,
        kind: "grievance_resolved",
        body: `Grievance ${id} resolved by the Empowered Committee: ${resolution}`,
      });
      return { grievance: rows[0] };
    });
  });
}
