import type { FastifyInstance } from "fastify";
import { loadConfig } from "../src/config";
import { createPool, type Pool } from "../src/db";
import { migrate } from "../src/migrate";
import { seedDemo, seedRules } from "../src/seed";
import { buildApp } from "../src/app";
import { createAdapters } from "../src/adapters";
import { hashPassword } from "../src/auth/passwords";
import type { Ctx } from "../src/context";

export const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://anumati:anumati@localhost:5432/anumati_test";

export async function freshContext(overrides: Record<string, string> = {}): Promise<{ ctx: Ctx; app: FastifyInstance; pool: Pool }> {
  const cfg = loadConfig({
    NODE_ENV: "test",
    DATABASE_URL: TEST_DB,
    JWT_SECRET: "test-secret-test-secret-test-secret-000",
    DEMO_MODE: "true",
    ADAPTER_MODE: "fixture",
    DSC_MODE: "demo",
    DOCUMENT_STORE_DIR: `/tmp/anumati-test-docs-${process.pid}`,
    EXTRACTION_TOKEN: "extraction-token-for-tests-000000",
    LOG_LEVEL: "silent",
    LOGIN_RATE_LIMIT: "1000",
    ...overrides,
  });
  const pool = createPool(cfg.DATABASE_URL, 5);
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await pool.query("DROP SCHEMA IF EXISTS pgboss CASCADE;");
  await migrate(pool);
  await seedRules(pool, cfg);
  await seedDemo(pool, cfg);
  await pool.query(
    `INSERT INTO app_user (username, password_hash, role, name, is_demo) VALUES ('root', $1, 'admin', 'Test admin', false)`,
    [await hashPassword("root")],
  );
  const ctx: Ctx = { pool, cfg, boss: null, adapters: createAdapters(cfg), log: { info() {}, warn() {}, error() {}, debug() {} } };
  const app = await buildApp(ctx, { logger: false });
  return { ctx, app, pool };
}

export async function login(app: FastifyInstance, username: string, password = "demo"): Promise<string> {
  const res = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { username, password } });
  if (res.statusCode !== 200) throw new Error(`login ${username}: ${res.statusCode} ${res.body}`);
  return res.json().token;
}

export function as(token: string) {
  return { authorization: `Bearer ${token}` };
}

/** A multipart body with one file and one text field, built by hand. */
export function multipart(kind: string, filename: string, bytes: Buffer, mime = "application/pdf") {
  const boundary = `----anumati${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\n${kind}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { payload: Buffer.concat([head, bytes, tail]), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

export const pdf = (text: string) => Buffer.from(`%PDF-1.4\n% ${text}\n%%EOF\n`);
