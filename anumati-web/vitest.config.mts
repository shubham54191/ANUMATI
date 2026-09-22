import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite resolves the "@/..." aliases straight from tsconfig, so the tests
  // import exactly what the application imports.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
