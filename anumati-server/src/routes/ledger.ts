import type { FastifyInstance } from "fastify";
import type { Ctx } from "../context";
import { need, needRole } from "../auth/guard";
import { forbidden } from "../errors";
import { anchorToday, ledgerFor, verifyLedger } from "../ledger/ledger";

export async function ledgerRoutes(app: FastifyInstance, ctx: Ctx) {
  /** The record of one file, or (for the Committee) of everything. */
  app.get("/v1/ledger", async (req) => {
    const p = need(req);
    const q = req.query as { application_id?: string; limit?: string };
    const limit = Math.min(500, Math.max(1, Number(q.limit ?? 200)));
    if (!q.application_id && !["committee", "admin"].includes(p.role) && p.department_id !== "single-window") {
      throw forbidden("Name a file; the whole ledger is for the Committee and the facilitation desk.");
    }
    if (q.application_id && p.role === "applicant") {
      const own = await ctx.pool.query("SELECT 1 FROM application WHERE id = $1 AND owner_id = $2", [q.application_id, p.id]);
      if (!own.rowCount) throw forbidden("This file is not yours.");
    }
    return { data: await ledgerFor(ctx.pool, q.application_id ?? null, limit) };
  });

  /**
   * Recompute the whole chain. Anyone signed in may ask: a record only an
   * insider can check is not much of a record.
   */
  app.get("/v1/ledger/verify", async (req) => {
    need(req);
    return verifyLedger(ctx.pool);
  });

  app.post("/v1/ledger/anchor", async (req) => {
    needRole(req, "committee");
    return { anchor: await anchorToday(ctx.pool, "manual anchor from the Committee desk") };
  });
}
