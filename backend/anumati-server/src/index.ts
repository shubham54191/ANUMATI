import { PgBoss } from "pg-boss";
import { loadConfig } from "./config";
import { createPool } from "./db";
import { migrate } from "./migrate";
import { seedDemo, seedRules } from "./seed";
import { buildApp } from "./app";
import { createAdapters } from "./adapters";
import { ensureQueues } from "./jobs/queues";
import type { Ctx } from "./context";

/**
 * The API process. It migrates, makes sure a rule set is published, and
 * serves. It enqueues jobs but does not run them — that is the worker's job,
 * so a slow department system can never hold up a request.
 */
const cfg = loadConfig();
const pool = createPool(cfg.DATABASE_URL, cfg.DB_POOL_MAX);
await migrate(pool);
await seedRules(pool, cfg);
if (cfg.DEMO_MODE) await seedDemo(pool, cfg);

const boss = new PgBoss({ connectionString: cfg.DATABASE_URL, max: 3 });
boss.on("error", (e) => console.error("[pg-boss]", e.message));
await boss.start();
await ensureQueues(boss);

const ctx: Ctx = { pool, cfg, boss, adapters: createAdapters(cfg), log: console as unknown as Ctx["log"] };
const app = await buildApp(ctx);
ctx.log = app.log;

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await boss.stop({ graceful: true, timeout: 10_000 });
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ port: cfg.PORT, host: cfg.HOST });
app.log.info(
  { demo: cfg.DEMO_MODE, adapters: cfg.ADAPTER_MODE, dsc: cfg.DSC_MODE },
  `ANUMATI API listening on ${cfg.HOST}:${cfg.PORT}`,
);
