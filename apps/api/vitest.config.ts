import { defineConfig } from "vitest/config";

// Duplicated from packages/dal/src/test-utils/test-db.ts's TEST_DATABASE_URL
// (same default, same TEST_DATABASE_URL env override) rather than imported:
// Vite's config loader can't resolve a NodeNext-style ".js" specifier back
// to a sibling ".ts" file for a cross-package deep import here — the same
// class of issue documented in Engineering Decision #17.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_test";

export default defineConfig({
  test: {
    // Integration tests share one real Postgres test database — running
    // files in parallel would race each other's truncate/insert calls.
    fileParallelism: false,
    globalSetup: "./src/test-utils/global-setup.ts",
    setupFiles: ["./src/test-utils/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_SECRET: "test-secret-not-for-production-0000000000",
      BETTER_AUTH_URL: "http://localhost:3000",
      WEB_ORIGIN: "http://localhost:5173",
      RESEND_API_KEY: "",
      EMAIL_FROM: "Healthcare <onboarding@resend.dev>",
      ADMIN_EMAILS: "admin-test@example.com",
      DOCTOR_EMAILS: "doctor-test@example.com",
      NURSE_EMAILS: "nurse-test@example.com",
      UPLOAD_DIR: "./uploads-test",
      MAX_UPLOAD_SIZE_MB: "5",
    },
  },
});
