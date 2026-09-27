import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Pool } from "./db";

export const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL("../migrations", import.meta.url));

/**
 * Apply every migration in order, once. A migration that was applied and has
 * since been edited is refused — schema history is not rewritten in place,
 * any more than the ledger is.
 */
export async function migrate(pool: Pool, dir = MIGRATIONS_DIR): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('anumati_migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migration (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Map<string, string>(
      (await client.query("SELECT name, checksum FROM schema_migration")).rows.map((r) => [r.name, r.checksum]),
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = await readFile(path.join(dir, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const prior = done.get(file);
      if (prior) {
        if (prior !== checksum) {
          throw new Error(`Migration ${file} was changed after it was applied. Add a new migration instead.`);
        }
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migration (name, checksum) VALUES ($1, $2)", [file, checksum]);
        await client.query("COMMIT");
        applied.push(file);
      } catch (e) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('anumati_migrations'))").catch(() => undefined);
    client.release();
  }
  return applied;
}
