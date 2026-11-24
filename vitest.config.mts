import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // the first conversion launches Chrome, which takes a few seconds
    testTimeout: 30_000,
    // `*.test-d.ts` files are only type-checked: run, the type tests would start conversions
    typecheck: { enabled: true },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/typings/**"],
      reporter: ["text", "json"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: -10
      }
    }
  }
});
