import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgBoss } from "pg-boss";
import type { FastifyInstance } from "fastify";
import { as, freshContext, login, TEST_DB } from "./helpers";
import { registerWorkers } from "../src/jobs/register";
import { buildApp } from "../src/app";
import type { Ctx } from "../src/context";
import type { Pool } from "../src/db";

let boss: PgBoss;
let app: FastifyInstance;
let pool: Pool;
let ctx: Ctx;

async function until<T>(fn: () => Promise<T | null | undefined | false>, ms = 15_000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v as T;
    if (Date.now() > end) throw new Error("timed out waiting");
    await new Promise((r) => setTimeout(r, 200));
  }
}

beforeAll(async () => {
  const base = await freshContext();
  await base.app.close();
  pool = base.pool;
  boss = new PgBoss({ connectionString: TEST_DB, max: 4 });
  boss.on("error", () => undefined);
  await boss.start();
  ctx = { ...base.ctx, boss };
  await registerWorkers(boss, ctx);
  app = await buildApp(ctx, { logger: false });
});

afterAll(async () => {
  await app.close();
  await boss.stop({ graceful: false, timeout: 2000 });
  await pool.end();
});

describe("jobs enqueued in the command's own transaction", () => {
  it("delivers every desk and fetches every registry record after a dispatch", async () => {
    const officer = await login(app, "officer", "admin");
    const r = await app.inject({
      method: "POST",
      url: "/v1/matrix/files/APP-2026-0148/commands",
      headers: as(officer),
      payload: { type: "dispatch" },
    });
    expect(r.statusCode, r.body).toBe(200);
    const desks = r.json().file.reviews.length;

    const delivered = await until(async () => {
      const q = await pool.query(
        "SELECT count(*)::int AS n FROM decision_ledger WHERE kind = 'integration.delivered' AND application_id = 'APP-2026-0148'",
      );
      return q.rows[0].n >= desks ? q.rows[0].n : null;
    });
    expect(delivered).toBe(desks);

    const fetched = await until(async () => {
      const f = await app.inject({ url: "/v1/matrix/files/APP-2026-0148", headers: as(officer) });
      const recs = f.json().file.records as { state: string }[];
      return recs.every((x) => x.state !== "idle" && x.state !== "fetching") ? recs : null;
    });
    expect(fetched.some((x) => x.state === "mismatch")).toBe(true);
  });

  it("never delivers the same desk twice for the same day", async () => {
    const q = await pool.query(
      "SELECT count(*)::int AS n, count(DISTINCT idempotency_key)::int AS d FROM integration_call WHERE adapter = 'department'",
    );
    expect(q.rows[0].n).toBe(q.rows[0].d);
  });
});
