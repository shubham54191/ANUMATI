import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Ctx } from "../context";
import { needRole } from "../auth/guard";
import { tx } from "../db";
import { conflict, notFound, unprocessable } from "../errors";
import { appendLedger } from "../ledger/ledger";
import { findCycle, invalidateRules } from "../engine/bridge";

/** What the extraction pipeline (or a reviewer by hand) proposes. */
const Draft = z.object({
  approval_id: z.string().regex(/^[A-Z][A-Z0-9-]{1,15}$/),
  name: z.string().trim().min(3).max(200),
  department_id: z.string().min(2).max(40),
  department_name: z.string().min(2).max(200),
  department_short: z.string().min(2).max(40),
  stage: z.enum(["pre_establishment", "pre_operation"]),
  statutory_days: z.number().int().min(0).max(3650),
  deemed_exists: z.boolean(),
  deemed_days: z.number().int().min(1).max(3650).nullable(),
  deemed_reference: z.string().min(3).max(300).nullable(),
  required_documents: z.array(z.string().min(2).max(200)).max(80),
  produces_document: z.string().max(200).nullable(),
  conditional_on: z.string().max(60).nullable().default(null),
  // No citation, no row — the same rule the database enforces.
  source: z.object({
    document_id: z.string().min(2).max(80),
    title: z.string().min(2).max(300).nullish(),
    section: z.string().min(1).max(120),
    url: z.string().url(),
    effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  extraction: z
    .object({
      page: z.number().int().min(1).nullish(),
      excerpt: z.string().max(4000).nullish(),
      model: z.string().max(80).nullish(),
      confidence: z.number().min(0).max(1).nullish(),
      flags: z.array(z.string()).nullish(),
    })
    .optional(),
  proposed_edges: z
    .array(
      z.object({
        from_approval_id: z.string(),
        edge_type: z.enum(["statutory", "documentary", "physical", "practice"]),
        confidence: z.number().gt(0).max(1),
        rationale: z.string().min(5).max(1000),
        evidence_document: z.string().max(200).nullable().optional(),
      }),
    )
    .max(40)
    .default([]),
});

export async function ruleRoutes(app: FastifyInstance, ctx: Ctx) {
  app.get("/v1/rules", async (req) => {
    needRole(req, "reviewer");
    const status = (req.query as { status?: string }).status ?? "draft";
    const { rows } = await ctx.pool.query(
      `SELECT approval_id, version, name, department_id, statutory_days, deemed_exists, deemed_days,
              deemed_reference, source_document_id, section, valid_from, valid_to, review_status,
              extraction, body, created_at, reviewed_at, review_note
         FROM approval_version WHERE review_status = $1 ORDER BY approval_id, version DESC`,
      [status],
    );
    return { data: rows };
  });

  /** A draft never reaches an applicant. It waits here until a person publishes it. */
  app.post("/v1/rules/drafts", async (req, reply) => {
    const p = needRole(req, "reviewer");
    const d = Draft.parse(req.body);
    if (d.deemed_exists && (d.deemed_days === null || !d.deemed_reference)) {
      throw unprocessable("A deeming clause needs its period and the provision that grants it.");
    }
    const out = await tx(ctx.pool, async (c) => {
      await c.query(
        "INSERT INTO source_document (id, title, url) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
        [d.source.document_id, d.source.title ?? d.source.document_id, d.source.url],
      );
      const v = await c.query(
        "SELECT COALESCE(MAX(version), 0) + 1 AS next FROM approval_version WHERE approval_id = $1",
        [d.approval_id],
      );
      const version = v.rows[0].next as number;
      const body = {
        id: d.approval_id,
        name: d.name,
        department_id: d.department_id,
        department_name: d.department_name,
        department_short: d.department_short,
        stage: d.stage,
        statutory_days: d.statutory_days,
        deemed_exists: d.deemed_exists,
        deemed_days: d.deemed_days,
        deemed_reference: d.deemed_reference,
        required_documents: d.required_documents,
        produces_document: d.produces_document,
        conditional_on: d.conditional_on,
        confidence: d.extraction?.confidence ?? 0.9,
        review_status: "draft",
        flagged: Boolean(d.extraction?.flags?.length),
        source: { ...d.source, effective_to: null },
        verified_by: null,
        verified_on: null,
        version: `draft-${version}`,
      };
      await c.query(
        `INSERT INTO approval_version
           (approval_id, version, name, department_id, statutory_days, deemed_exists, deemed_days,
            deemed_reference, body, source_document_id, section, valid_from, review_status, extraction, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft',$13,$14)`,
        [
          d.approval_id, version, d.name, d.department_id, d.statutory_days, d.deemed_exists,
          d.deemed_days, d.deemed_reference, JSON.stringify({ ...body, proposed_edges: d.proposed_edges }),
          d.source.document_id, d.source.section, d.source.effective_from,
          JSON.stringify(d.extraction ?? {}), p.service ? null : p.id,
        ],
      );
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.service ? null : p.id,
        kind: "rule.drafted",
        approval_id: d.approval_id,
        inputs: { source: d.source, extraction: d.extraction ?? null },
        outputs: { version, edges_proposed: d.proposed_edges.length },
        rules_version: ctx.cfg.RULES_VERSION,
        engine_version: ctx.cfg.ENGINE_VERSION,
      });
      return { approval_id: d.approval_id, version };
    });
    reply.status(201);
    return out;
  });

  /**
   * Publishing creates a new rule-set version. The approval's previous version
   * is superseded, not edited: roadmaps filed against it keep resolving
   * against the version they were built on.
   */
  app.post("/v1/rules/:approvalId/:version/publish", async (req) => {
    const p = needRole(req, "reviewer");
    if (p.service) throw unprocessable("A person publishes rules. The pipeline only drafts them.");
    const { approvalId, version } = req.params as { approvalId: string; version: string };
    const { note } = z.object({ note: z.string().trim().min(5).max(1000) }).parse(req.body);
    const out = await tx(ctx.pool, async (c) => {
      const { rows } = await c.query(
        "SELECT * FROM approval_version WHERE approval_id = $1 AND version = $2 FOR UPDATE",
        [approvalId, Number(version)],
      );
      const draft = rows[0];
      if (!draft) throw notFound(`Rule ${approvalId} v${version}`);
      if (draft.review_status !== "draft") throw conflict(`This version is ${draft.review_status}, not a draft.`);

      const today = new Date().toISOString().slice(0, 10);
      await c.query(
        `UPDATE approval_version SET review_status = 'superseded', valid_to = $2
          WHERE approval_id = $1 AND review_status = 'published'`,
        [approvalId, today],
      );
      const { proposed_edges = [], ...approval } = draft.body as Record<string, unknown> & {
        proposed_edges?: { from_approval_id: string; edge_type: string; confidence: number; rationale: string; evidence_document?: string | null }[];
      };
      const published = {
        ...approval,
        review_status: "published",
        verified_by: p.name,
        verified_on: today,
      };
      await c.query(
        `UPDATE approval_version SET review_status = 'published', valid_from = $3, body = $4,
           reviewed_by = $5, reviewed_at = now(), review_note = $6
         WHERE approval_id = $1 AND version = $2`,
        [approvalId, Number(version), today, JSON.stringify(published), p.id, note],
      );
      for (const e of proposed_edges) {
        const dep = {
          from_approval_id: e.from_approval_id,
          to_approval_id: approvalId,
          edge_type: e.edge_type,
          confidence: e.confidence,
          rationale: e.rationale,
          evidence_document: e.evidence_document ?? null,
          condition: null,
          source: { document_id: draft.source_document_id, section: draft.section, url: (approval.source as { url: string }).url },
        };
        await c.query(
          `INSERT INTO dependency_version (from_approval, to_approval, edge_type, confidence, rationale, body, review_status, valid_from)
           VALUES ($1,$2,$3,$4,$5,$6,'published',$7)`,
          [e.from_approval_id, approvalId, e.edge_type, e.confidence, e.rationale, JSON.stringify(dep), today],
        );
      }
      const allA = await c.query("SELECT approval_id FROM approval_version WHERE review_status = 'published'");
      const allD = await c.query("SELECT body FROM dependency_version WHERE review_status = 'published'");
      const cycle = findCycle(
        allA.rows.map((r) => r.approval_id as string),
        allD.rows.map((r) => r.body as { from_approval_id: string; to_approval_id: string }),
      );
      if (cycle) throw unprocessable("Publishing this would create a dependency cycle.", { cycle });

      const cur = await c.query("SELECT version FROM rule_set WHERE is_current");
      const [maj, min] = String(cur.rows[0]?.version ?? "v1.0").replace(/^v/, "").split(".").map(Number);
      const next = `v${maj}.${(min ?? 0) + 1}`;
      await c.query("UPDATE rule_set SET is_current = false WHERE is_current");
      await c.query(
        "INSERT INTO rule_set (version, published_by, note, is_current) VALUES ($1,$2,$3,true)",
        [next, p.id, `${approvalId} v${version}: ${note}`],
      );
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "rule.published",
        approval_id: approvalId,
        inputs: { version: Number(version), note },
        outputs: { rules_version: next, edges: proposed_edges.length },
        rules_version: next,
        engine_version: ctx.cfg.ENGINE_VERSION,
      });
      return { approval_id: approvalId, version: Number(version), rules_version: next };
    });
    invalidateRules();
    return out;
  });

  app.post("/v1/rules/:approvalId/:version/reject", async (req) => {
    const p = needRole(req, "reviewer");
    if (p.service) throw unprocessable("A person reviews drafts.");
    const { approvalId, version } = req.params as { approvalId: string; version: string };
    const { note } = z.object({ note: z.string().trim().min(5).max(1000) }).parse(req.body);
    return tx(ctx.pool, async (c) => {
      const res = await c.query(
        `UPDATE approval_version SET review_status = 'rejected', reviewed_by = $3, reviewed_at = now(), review_note = $4
          WHERE approval_id = $1 AND version = $2 AND review_status = 'draft' RETURNING approval_id`,
        [approvalId, Number(version), p.id, note],
      );
      if (!res.rowCount) throw notFound(`Draft ${approvalId} v${version}`);
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "rule.rejected",
        approval_id: approvalId,
        inputs: { version: Number(version) },
        outputs: { note },
        rules_version: ctx.cfg.RULES_VERSION,
        engine_version: ctx.cfg.ENGINE_VERSION,
      });
      return { ok: true };
    });
  });
}
