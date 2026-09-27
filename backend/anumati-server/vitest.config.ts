import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // One database, so test files run one after another.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
