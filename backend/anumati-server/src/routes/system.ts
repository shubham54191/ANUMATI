import type { FastifyInstance } from "fastify";
import pg from "pg";
import type { Ctx } from "../context";
import { need } from "../auth/guard";
import { forbidden } from "../errors";

export async function systemRoutes(app: FastifyInstance, ctx: Ctx) {
  app.get("/healthz", async () => ({ ok: true }));

  /** Ready means the database answers and a rule set is published. */
  app.get("/readyz", async (_req, reply) => {
    try {
      const r = await ctx.pool.query("SELECT version FROM rule_set WHERE is_current");
      if (!r.rows[0]) return reply.status(503).send({ ok: false, reason: "no published rule set" });
      return { ok: true, rules_version: r.rows[0].version };
    } catch (e) {
      return reply.status(503).send({ ok: false, reason: (e as Error).message });
    }
  });

  /** What this server is, said plainly — the UI shows it, so nobody mistakes a demo for the real thing. */
  app.get("/v1/meta", async () => {
    const r = await ctx.pool.query("SELECT version FROM rule_set WHERE is_current");
    return {
      rules_version: r.rows[0]?.version ?? null,
      engine_version: ctx.cfg.ENGINE_VERSION,
      demo_mode: ctx.cfg.DEMO_MODE,
      adapter_mode: ctx.adapters.mode,
      dsc_mode: ctx.cfg.DSC_MODE,
      jobs: Boolean(ctx.boss),
      integrations: ctx.adapters.breakers.map((b) => ({ name: b.name, circuit: b.state })),
    };
  });

  app.get("/v1/notifications", async (req) => {
    const p = need(req);
    const { rows } = await ctx.pool.query(
      `SELECT id, application_id, kind, body, created_at, delivered_at, channel
         FROM notification WHERE recipient_user = $1 OR ($2 = 'committee' AND recipient_role = 'committee')
        ORDER BY created_at DESC LIMIT 100`,
      [p.id, p.role],
    );
    return { data: rows };
  });

  /** Deliveries that exhausted their retries — the officer's exceptions list. */
  app.get("/v1/integration/exceptions", async (req) => {
    const p = need(req);
    if (!(p.role === "admin" || p.department_id === "single-window" || p.role === "committee")) {
      throw forbidden("The exceptions list belongs to the facilitation desk.");
    }
    const { rows } = await ctx.pool.query(
      "SELECT * FROM integration_exception WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT 200",
    );
    return { data: rows };
  });

  /**
   * Live updates: one Server-Sent Events stream per browser, fed by Postgres
   * LISTEN/NOTIFY. Every committed command notifies; clients refetch the file.
   */
  const listener = new pg.Client({ connectionString: ctx.cfg.DATABASE_URL });
  const clients = new Set<{ write: (s: string) => void; filter: string | null; canSee: (id: string) => Promise<boolean> }>();
  let listening = false;
  async function ensureListening() {
    if (listening) return;
    listening = true;
    await listener.connect();
    await listener.query("LISTEN anumati_events");
    listener.on("notification", (n) => {
      let payload: { application_id?: string } = {};
      try {
        payload = JSON.parse(n.payload ?? "{}");
      } catch {
        return;
      }
      for (const c of clients) {
        if (c.filter && c.filter !== payload.application_id) continue;
        void c.canSee(payload.application_id ?? "").then((ok) => ok && c.write(`event: file\ndata: ${n.payload}\n\n`));
      }
    });
  }
  app.addHook("onClose", async () => {
    if (listening) await listener.end().catch(() => undefined);
  });

  app.get("/v1/events", async (req, reply) => {
    const p = need(req);
    await ensureListening();
    const filter = (req.query as { application_id?: string }).application_id ?? null;
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      "access-control-allow-origin": req.headers.origin ?? "*",
      "access-control-allow-credentials": "true",
    });
    reply.raw.write(`event: hello\ndata: ${JSON.stringify({ user: p.username })}\n\n`);
    const client = {
      write: (s: string) => reply.raw.write(s),
      filter,
      canSee: async (id: string) => {
        if (p.role !== "applicant") return true;
        const r = await ctx.pool.query("SELECT 1 FROM application WHERE id = $1 AND owner_id = $2", [id, p.id]);
        return Boolean(r.rowCount);
      },
    };
    clients.add(client);
    const beat = setInterval(() => reply.raw.write(": keep-alive\n\n"), 25_000);
    req.raw.on("close", () => {
      clearInterval(beat);
      clients.delete(client);
    });
    return reply.hijack();
  });
}
