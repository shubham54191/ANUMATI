import { createPool } from "../db";
import { migrate } from "../migrate";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const pool = createPool(url, 2);
try {
  const applied = await migrate(pool);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Schema is up to date.");
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
