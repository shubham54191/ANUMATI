import { PgBoss } from "pg-boss";
import pino from "pino";
import { loadConfig } from "./config";
import { createPool } from "./db";
import { migrate } from "./migrate";
import { createAdapters } from "./adapters";
import { registerWorkers } from "./jobs/register";
import type { Ctx } from "./context";

/**
 * The worker process: department deliveries, registry checks, MAITRI
 * notifications, and the three schedules — the SLA Sentinel every minute,
 * renewal alerts every morning, the ledger anchor every night.
 */
const cfg = loadConfig();
const log = pino({ level: cfg.LOG_LEVEL, name: "anumati-worker" });
const pool = createPool(cfg.DATABASE_URL, 5);
await migrate(pool);

const boss = new PgBoss({ connectionString: cfg.DATABASE_URL, max: 5 });
boss.on("error", (e) => log.error({ err: e }, "pg-boss error"));
await boss.start();

const ctx: Ctx = { pool, cfg, boss, adapters: createAdapters(cfg), log };
await registerWorkers(boss, ctx);
log.info({ adapters: cfg.ADAPTER_MODE }, "ANUMATI worker running");

const shutdown = async () => {
  await boss.stop({ graceful: true, timeout: 20_000 });
  await pool.end();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
