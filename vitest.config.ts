import { defineConfig } from "vitest/config";
import path from "node:path";
import "./scripts/load-env.ts";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // `server-only` throws on import outside a React Server Component
      // build. It is a guard for the bundler, and the modules it protects are
      // exactly the ones worth testing.
      "server-only": path.resolve(import.meta.dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The concurrency tests open several real connections on purpose. Running
    // files in parallel against one scratch database would make their results
    // depend on each other.
    fileParallelism: false,
    testTimeout: 30_000,
    setupFiles: ["./tests/setup.ts"],
  },
});
