import { defineConfig } from "tsup";

// The engine lives in ../anumati-web/lib and is bundled in, so the API runs
// exactly the functions the browser runs. node_modules stay external.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    worker: "src/worker.ts",
    migrate: "src/cli/migrate.ts",
    seed: "src/cli/seed.ts",
    "verify-ledger": "src/cli/verify-ledger.ts",
  },
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  splitting: true,
  shims: false,
});
