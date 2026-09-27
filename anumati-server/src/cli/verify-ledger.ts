import { createPool } from "../db";
import { verifyLedger } from "../ledger/ledger";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const pool = createPool(url, 2);
try {
  const r = await verifyLedger(pool);
  console.log(JSON.stringify(r, null, 2));
  process.exitCode = r.ok ? 0 : 2;
} finally {
  await pool.end();
}
