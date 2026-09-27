import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Ctx } from "../context";
import { systemPrincipal } from "../context";
import { need, needRole } from "../auth/guard";
import { tx } from "../db";
import { AppError, badRequest, forbidden, notFound, unprocessable } from "../errors";
import { appendLedger } from "../ledger/ledger";
import { fileFromApplication } from "../engine/bridge";
import { commandInTx, readFileFor } from "../matrix/service";
import { canView } from "../matrix/commands";
import { project } from "../matrix/store";
import { DocumentStore, sniffMime } from "../documents/store";
import { prevalidate, prevalidationSummary, submissionGaps } from "@/lib/compliance/prevalidate";
import { SEED_DOSSIER } from "@/lib/data/dossier";
import type { Roadmap } from "@/types/roadmap";
import type { CrossFormField, Dossier } from "@/types/compliance";
import type { Principal } from "../auth/tokens";

/**
 * The common application form. Filled once; every department's form reads the
 * same figure, which is why a cross-form mismatch cannot start here.
 */
export const CommonForm = z
  .object({
    plot_number: z.string().max(60),
    built_up_sqm: z.number().positive().max(10_000_000),
    connected_load_kva: z.number().positive().max(1_000_000),
    water_draw_kld: z.number().positive().max(1_000_000),
    employees: z.number().int().min(0).max(1_000_000),
    investment_lakh: z.number().min(0).max(10_000_000),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must look like ABCDE1234F"),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "GSTIN must be 15 characters, e.g. 27ABCDE1234F1Z5"),
  })
  .partial();
export type CommonForm = z.infer<typeof CommonForm>;

/** Which approvals' forms carry which common-form figure. */
const FORM_FIELDS: { id: string; label: string; unit: string; from: keyof CommonForm; approvals: string[]; blocking_for: string[] }[] = [
  { id: "water_draw", label: "Water draw declared", unit: "KLD", from: "water_draw_kld", approvals: ["A12", "A15"], blocking_for: ["A15"] },
  { id: "built_up", label: "Built-up area declared", unit: "sq m", from: "built_up_sqm", approvals: ["A10", "A16", "A25"], blocking_for: [] },
  { id: "connected_load", label: "Connected load declared", unit: "kVA", from: "connected_load_kva", approvals: ["A11", "A22"], blocking_for: ["A22"] },
];

function fieldsFromForm(form: CommonForm, roadmap: Roadmap): CrossFormField[] {
  const on = new Set(roadmap.approvals.map((a) => a.id));
  return FORM_FIELDS.filter((f) => typeof form[f.from] === "number").map((f) => ({
    id: f.id,
    label: f.label,
    unit: f.unit,
    declared: Object.fromEntries(f.approvals.filter((a) => on.has(a)).map((a) => [a, form[f.from] as number])),
    blocking_for: f.blocking_for,
  }));
}

const Create = z.object({
  roadmap_id: z.string().min(4),
  project: z.string().trim().min(3).max(200),
  applicant_name: z.string().trim().min(2).max(200).optional(),
  common_form: CommonForm.optional(),
  /** Start from the demo unit's dossier — including its deliberate mismatch. */
  start_from_sample: z.boolean().optional(),
});

const Patch = z.object({
  project: z.string().trim().min(3).max(200).optional(),
  common_form: CommonForm.optional(),
});

async function loadApplication(ctx: Ctx, id: string, p: Principal) {
  const { rows } = await ctx.pool.query(
    `SELECT a.*, r.result AS roadmap FROM application a LEFT JOIN roadmap r ON r.id = a.roadmap_id WHERE a.id = $1`,
    [id],
  );
  const app = rows[0];
  if (!app) throw notFound(`Application ${id}`);
  if (p.role === "applicant" && app.owner_id !== p.id) throw forbidden("This application is not yours.");
  return app as {
    id: string;
    owner_id: string | null;
    roadmap_id: string | null;
    applicant_name: string;
    project: string;
    sector: string;
    location: string;
    common_form: CommonForm;
    dossier: Dossier;
    status: string;
    rules_version: string;
    engine_version: string;
    roadmap: Roadmap | null;
    filed_at: Date | null;
    created_at: Date;
  };
}

export async function applicationRoutes(app: FastifyInstance, ctx: Ctx) {
  const store = new DocumentStore(ctx.cfg.DOCUMENT_STORE_DIR);

  app.post("/v1/applications", async (req, reply) => {
    const p = needRole(req, "applicant");
    const body = Create.parse(req.body);
    const rm = await ctx.pool.query("SELECT * FROM roadmap WHERE id = $1", [body.roadmap_id]);
    if (!rm.rows[0]) throw notFound(`Roadmap ${body.roadmap_id}`);
    if (rm.rows[0].owner_id && rm.rows[0].owner_id !== p.id) throw forbidden("That roadmap belongs to someone else.");
    const roadmap = rm.rows[0].result as Roadmap;
    const form = body.common_form ?? {};
    const dossier: Dossier = body.start_from_sample
      ? structuredClone(SEED_DOSSIER)
      : { documents: [], fields: fieldsFromForm(form, roadmap) };

    const created = await tx(ctx.pool, async (c) => {
      const seq = (await c.query("SELECT nextval('application_seq') AS n")).rows[0].n as number;
      const id = `APP-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
      await c.query(
        `INSERT INTO application
           (id, owner_id, roadmap_id, applicant_name, project, sector, location, common_form, dossier,
            status, rules_version, engine_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11)`,
        [
          id, p.id, body.roadmap_id, body.applicant_name ?? p.name, body.project,
          roadmap.request.sector, roadmap.request.location, JSON.stringify(form), JSON.stringify(dossier),
          rm.rows[0].rules_version, rm.rows[0].engine_version,
        ],
      );
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "application.created",
        application_id: id,
        inputs: { roadmap_id: body.roadmap_id, project: body.project, from_sample: Boolean(body.start_from_sample) },
        outputs: { approvals: roadmap.approvals.length },
        rules_version: rm.rows[0].rules_version,
        engine_version: rm.rows[0].engine_version,
      });
      return id;
    });
    reply.status(201);
    return { id: created };
  });

  app.get("/v1/applications", async (req) => {
    const p = need(req);
    const { rows } = await ctx.pool.query(
      p.role === "applicant"
        ? "SELECT id, project, status, roadmap_id, filed_at, created_at FROM application WHERE owner_id = $1 ORDER BY created_at DESC"
        : "SELECT id, project, applicant_name, status, roadmap_id, filed_at, created_at FROM application ORDER BY created_at DESC LIMIT 200",
      p.role === "applicant" ? [p.id] : [],
    );
    if (p.role !== "applicant" && p.role !== "admin" && p.role !== "committee" && p.department_id !== "single-window") {
      throw forbidden("Department officers see files on the clearance console, not the application list.");
    }
    return { data: rows };
  });

  app.get("/v1/applications/:id", async (req) => {
    const p = need(req);
    const a = await loadApplication(ctx, (req.params as { id: string }).id, p);
    if (p.role === "officer" && p.department_id !== "single-window") {
      throw forbidden("Open the file from the clearance console.");
    }
    const readiness = a.roadmap ? prevalidate(a.roadmap, a.dossier) : [];
    const docs = await ctx.pool.query(
      `SELECT d.kind, d.original_name, d.sha256, d.source, d.uploaded_at, x.byte_size, x.mime
         FROM application_document d JOIN document x ON x.sha256 = d.sha256
        WHERE d.application_id = $1 ORDER BY d.uploaded_at`,
      [a.id],
    );
    const grievances = await ctx.pool.query("SELECT * FROM grievance WHERE application_id = $1 ORDER BY raised_at DESC", [a.id]);
    const hasFile = (await ctx.pool.query("SELECT 1 FROM matrix_file WHERE application_id = $1", [a.id])).rowCount;
    return {
      application: {
        id: a.id,
        project: a.project,
        applicant_name: a.applicant_name,
        sector: a.sector,
        location: a.location,
        status: a.status,
        roadmap_id: a.roadmap_id,
        common_form: a.common_form,
        dossier: a.dossier,
        rules_version: a.rules_version,
        engine_version: a.engine_version,
        filed_at: a.filed_at,
        created_at: a.created_at,
      },
      readiness,
      summary: prevalidationSummary(readiness),
      submission_gaps: submissionGaps(readiness),
      documents: docs.rows,
      grievances: grievances.rows,
      file: hasFile ? await readFileFor(ctx, a.id, p) : null,
    };
  });

  app.patch("/v1/applications/:id", async (req) => {
    const p = needRole(req, "applicant");
    const a = await loadApplication(ctx, (req.params as { id: string }).id, p);
    if (a.status !== "draft") throw unprocessable("A filed application is changed through the clearance file, not edited.");
    const body = Patch.parse(req.body);
    const form = { ...a.common_form, ...(body.common_form ?? {}) };
    const dossier: Dossier = {
      documents: a.dossier.documents,
      // Keep a sample's recorded mismatch until the applicant enters their own figure.
      fields: a.roadmap
        ? [
            ...fieldsFromForm(form, a.roadmap),
            ...a.dossier.fields.filter((f) => !FORM_FIELDS.some((ff) => ff.id === f.id && typeof form[ff.from] === "number")),
          ]
        : a.dossier.fields,
    };
    await ctx.pool.query(
      "UPDATE application SET project = COALESCE($2, project), common_form = $3, dossier = $4, updated_at = now() WHERE id = $1",
      [a.id, body.project ?? null, JSON.stringify(form), JSON.stringify(dossier)],
    );
    return { ok: true };
  });

  app.post("/v1/applications/:id/prevalidate", async (req) => {
    const p = need(req);
    const a = await loadApplication(ctx, (req.params as { id: string }).id, p);
    if (!a.roadmap) throw unprocessable("This application has no roadmap to check against.");
    const rows = prevalidate(a.roadmap, a.dossier);
    return { readiness: rows, summary: prevalidationSummary(rows), submission_gaps: submissionGaps(rows) };
  });

  /**
   * File it. The server re-runs pre-validation — the browser's pass is never
   * trusted — then, in one transaction, builds the clearance file from the
   * current wave, dispatches every desk at the same instant, enqueues one
   * delivery per department and the registry checks, and records it.
   */
  app.post("/v1/applications/:id/submit", async (req) => {
    const p = needRole(req, "applicant");
    const id = (req.params as { id: string }).id;
    return tx(ctx.pool, async (c) => {
      const { rows } = await c.query(
        `SELECT a.*, r.result AS roadmap FROM application a JOIN roadmap r ON r.id = a.roadmap_id
          WHERE a.id = $1 FOR UPDATE OF a`,
        [id],
      );
      const a = rows[0];
      if (!a) throw notFound(`Application ${id}`);
      if (a.owner_id !== p.id) throw forbidden("This application is not yours.");
      if (a.status !== "draft") throw unprocessable(`Already ${a.status}.`);
      const roadmap = a.roadmap as Roadmap;
      const readiness = prevalidate(roadmap, a.dossier);
      const summary = prevalidationSummary(readiness);
      if (!summary.submittable) {
        throw new AppError(422, "prevalidation_failed", "The file would be refused at the counter. Fix these first.", {
          submission_gaps: submissionGaps(readiness),
          summary,
        });
      }
      const waveIds = new Set(readiness.filter((r) => r.in_current_wave).map((r) => r.approval_id));
      const wave = roadmap.approvals.filter((x) => waveIds.has(x.id));
      const file = fileFromApplication({
        id,
        applicant: a.applicant_name,
        project: a.project,
        sector: a.sector,
        location: a.location,
        filed_on: new Date().toISOString().slice(0, 10),
        wave,
        dossier: a.dossier,
      });
      await c.query(
        "INSERT INTO matrix_file (application_id, state, version) VALUES ($1,$2,1)",
        [id, JSON.stringify(file)],
      );
      await project(c, null, file, p.username);
      await c.query(
        "UPDATE application SET status = 'submitted', filed_at = now(), updated_at = now() WHERE id = $1",
        [id],
      );
      await appendLedger(c, {
        actor: p.username,
        actor_id: p.id,
        kind: "application.submitted",
        application_id: id,
        inputs: { documents: a.dossier.documents.length },
        outputs: { wave: wave.map((w) => w.id), later: roadmap.approvals.length - wave.length },
        rules_version: a.rules_version,
        engine_version: a.engine_version,
      });
      // The facilitation desk's first act, done by the system on submission.
      const view = await commandInTx(ctx, c, id, { type: "dispatch" }, systemPrincipal("single-window"));
      return { id, wave: wave.map((w) => w.id), file: view };
    });
  });

  app.post(
    "/v1/applications/:id/documents",
    { bodyLimit: ctx.cfg.MAX_UPLOAD_BYTES + 1024 * 64 },
    async (req, reply) => {
      const p = needRole(req, "applicant");
      const a = await loadApplication(ctx, (req.params as { id: string }).id, p);
      if (a.status !== "draft" && a.status !== "returned") throw unprocessable("Documents are added before filing, or on revision.");
      const part = await req.file({ limits: { fileSize: ctx.cfg.MAX_UPLOAD_BYTES, files: 1 } });
      if (!part) throw badRequest("Send one file in a multipart field named 'file'.");
      const kind = String((part.fields.kind as { value?: string } | undefined)?.value ?? "").trim();
      if (kind.length < 2 || kind.length > 120) throw badRequest("Say which document this is in a field named 'kind'.");

      const put = await store.put(part.file, ctx.cfg.MAX_UPLOAD_BYTES);
      if (part.file.truncated) {
        await store.discard(put.sha256);
        throw new AppError(413, "too_large", `Files must be under ${ctx.cfg.MAX_UPLOAD_BYTES} bytes.`);
      }
      // The real type, from the first bytes — the declared one is not trusted.
      const mime = sniffMime(await store.head(put.sha256, 8));
      if (!mime) {
        const inUse = (await ctx.pool.query("SELECT 1 FROM document WHERE sha256 = $1", [put.sha256])).rowCount;
        if (!inUse) await store.discard(put.sha256);
        throw new AppError(415, "unsupported_type", "Only PDF, PNG and JPEG files are accepted.");
      }

      await tx(ctx.pool, async (c) => {
        await c.query(
          `INSERT INTO document (sha256, byte_size, mime, stored_path) VALUES ($1,$2,$3,$4)
           ON CONFLICT (sha256) DO NOTHING`,
          [put.sha256, put.bytes, mime, put.storedPath],
        );
        await c.query(
          `INSERT INTO application_document (application_id, sha256, kind, original_name, uploaded_by)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [a.id, put.sha256, kind, part.filename.slice(0, 200), p.id],
        );
        const documents = Array.from(new Set([...a.dossier.documents, kind]));
        await c.query("UPDATE application SET dossier = jsonb_set(dossier, '{documents}', $2::jsonb), updated_at = now() WHERE id = $1", [
          a.id,
          JSON.stringify(documents),
        ]);
        await appendLedger(c, {
          actor: p.username,
          actor_id: p.id,
          kind: "document.received",
          application_id: a.id,
          inputs: { kind, name: part.filename, bytes: put.bytes, mime },
          outputs: { sha256: put.sha256 },
          rules_version: a.rules_version,
          engine_version: a.engine_version,
          document_sha256: put.sha256,
        });
      });
      reply.status(201);
      return { sha256: put.sha256, bytes: put.bytes, mime, kind };
    },
  );

  app.get("/v1/documents/:sha256", async (req, reply) => {
    const p = need(req);
    const { sha256 } = req.params as { sha256: string };
    if (!/^[0-9a-f]{64}$/.test(sha256)) throw badRequest("Not a SHA-256.");
    const { rows } = await ctx.pool.query(
      `SELECT d.mime, ad.application_id, a.owner_id FROM document d
         JOIN application_document ad ON ad.sha256 = d.sha256
         JOIN application a ON a.id = ad.application_id WHERE d.sha256 = $1`,
      [sha256],
    );
    if (!rows[0]) throw notFound("Document");
    let allowed = false;
    for (const r of rows) {
      if (p.role === "applicant") allowed ||= r.owner_id === p.id;
      else if (p.role === "admin" || p.role === "committee" || p.department_id === "single-window") allowed = true;
      else if (p.role === "officer") {
        const f = await ctx.pool.query("SELECT state FROM matrix_file WHERE application_id = $1", [r.application_id]);
        if (f.rows[0] && canView(p, f.rows[0].state, r.owner_id)) allowed = true;
      }
    }
    if (!allowed) throw forbidden("This document is not on a file you can see.");
    reply.header("content-type", rows[0].mime);
    reply.header("x-content-sha256", sha256);
    reply.header("cache-control", "private, max-age=3600, immutable");
    return reply.send(store.read(sha256));
  });
}
