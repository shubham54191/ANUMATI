import { loadConfig } from "../config";
import { createPool } from "../db";
import { migrate } from "../migrate";
import { seedDemo, seedRules } from "../seed";

const cfg = loadConfig();
const pool = createPool(cfg.DATABASE_URL, 2);
try {
  await migrate(pool);
  await seedRules(pool, cfg);
  console.log("Rule base seeded (or already present).");
  if (cfg.DEMO_MODE) {
    await seedDemo(pool, cfg);
    console.log("Demo accounts and demo files seeded.");
  } else {
    console.log("DEMO_MODE is off — no demo accounts created.");
  }
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
