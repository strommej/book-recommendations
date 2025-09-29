import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    // setupFiles: ["./src/config/setupTests.ts"],
    coverage: {
      reporter: ["text", "json-summary", "lcov", "html"],
      reportsDirectory: "reports/vitest/coverage"
    },
    reporters: ["default", "junit"],
    outputFile: {
      junit: "reports/vitest/junit/junit.xml"
    }
  }
});
