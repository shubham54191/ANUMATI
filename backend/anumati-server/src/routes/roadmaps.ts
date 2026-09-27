import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Ctx } from "../context";
import { need } from "../auth/guard";
import { loadRules, roadmapFor } from "../engine/bridge";
import { appendLedger } from "../ledger/ledger";
import { tx } from "../db";
import { forbidden, notFound, unprocessable } from "../errors";
import { CyclicDependencyError } from "@/lib/data/engine";
import type { Roadmap } from "@/types/roadmap";

export const RoadmapRequest = z.object({
  sector: z.string().min(1).max(40),
  location: z.string().min(1).max(60),
  size_band: z.string().min(1).max(20),
  stage: z.string().min(1).max(20),
  conditions: z.record(z.union([z.boolean(), z.number()])),
});

export function metaFor(ctx: Ctx, rulesVersion: string, roadmap?: Roadmap) {
  return {
    rules_version: rulesVersion,
    rules_as_of: new Date().toISOString().slice(0, 10),
    engine_version: ctx.cfg.ENGINE_VERSION,
    generated_at: new Date().toISOString(),
    approvals_count: roadmap?.approvals.length ?? 0,
    flagged_count: roadmap?.approvals.filter((a) => a.flagged).length ?? 0,
  };
}

export async function roadmapRoutes(app: FastifyInstance, ctx: Ctx) {
  /**
   * Public, like the rule base it reads: anyone can ask what they need. It is
   * stored — against the signed-in applicant — only when someone is signed in.
   */
  app.post("/v1/roadmap", async (req, reply) => {
    const request = RoadmapRequest.parse(req.body);
    const id = `RM-${randomBytes(3).toString("hex").toUpperCase()}`;
    let result: { version: string; roadmap: Roadmap };
    try {
      result = await roadmapFor(ctx.pool, request, id);
    } catch (e) {
      if (e instanceof CyclicDependencyError) {
        throw unprocessable("The published rule base contains a dependency cycle.", { cycle: e.cycle });
      }
      throw e;
    }
    const p = req.principal;
    if (p) {
      await tx(ctx.pool, async (c) => {
        await c.query(
          `INSERT INTO roadmap (id, owner_id, request, result, rules_version, engine_version)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, p.service ? null : p.id, JSON.stringify(request), JSON.stringify(result.roadmap), result.version, ctx.cfg.ENGINE_VERSION],
        );
        await appendLedger(c, {
          actor: p.username,
          actor_id: p.id,
          kind: "roadmap.built",
          inputs: request,
          outputs: {
            roadmap_id: id,
            approvals: result.roadmap.approvals.length,
            sequential_days: result.roadmap.sequential_days,
            critical_path_days: result.roadmap.optimised_days,
            critical_path: result.roadmap.critical_path,
          },
          rules_version: result.version,
          engine_version: ctx.cfg.ENGINE_VERSION,
        });
      });
    }
    reply.header("x-anumati-stored", p ? "true" : "false");
    return { data: result.roadmap, meta: metaFor(ctx, result.version, result.roadmap), stored: Boolean(p) };
  });

  app.get("/v1/roadmaps/:id", async (req) => {
    const p = need(req);
    const { id } = req.params as { id: string };
    const { rows } = await ctx.pool.query("SELECT * FROM roadmap WHERE id = $1", [id]);
    if (!rows[0]) throw notFound(`Roadmap ${id}`);
    if (p.role === "applicant" && rows[0].owner_id !== p.id) throw forbidden("This roadmap is not yours.");
    return {
      data: rows[0].result,
      meta: { ...metaFor(ctx, rows[0].rules_version, rows[0].result), generated_at: rows[0].created_at },
    };
  });

  /** The published rule base, as the engine reads it. */
  app.get("/v1/approvals", async () => {
    const { version, rules } = await loadRules(ctx.pool);
    return { data: rules.approvals, dependencies: rules.dependencies, meta: { rules_version: version } };
  });
}
