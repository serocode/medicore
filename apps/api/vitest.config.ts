import { defineConfig } from "vitest/config";

// Duplicated from packages/dal/src/test-utils/test-db.ts's TEST_DATABASE_URL
// (same shape, same TEST_DATABASE_URL env override) rather than imported:
// Vite's config loader can't resolve a NodeNext-style ".js" specifier back
// to a sibling ".ts" file for a cross-package deep import here — the same
// class of issue documented in Engineering Decision #17.
//
// The database *name* deliberately differs from the DAL suite's. Both suites
// truncate every table, and Turbo runs their `test` tasks in parallel, so
// sharing one database made each one's `truncateAll` wipe rows the other was
// mid-assertion on. Separate databases keep the two parallel-safe.
const API_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_test_api";

// globalSetup runs in this same process and reads TEST_DATABASE_URL through
// the DAL helper's module-level const, so the api-specific value has to be in
// the environment before that import resolves. `test.env` below only reaches
// the worker threads that run the test files.
process.env.TEST_DATABASE_URL = API_TEST_DATABASE_URL;

export default defineConfig({
  test: {
    // Integration tests share one real Postgres test database — running
    // files in parallel would race each other's truncate/insert calls.
    fileParallelism: false,
    globalSetup: "./src/test-utils/global-setup.ts",
    setupFiles: ["./src/test-utils/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: API_TEST_DATABASE_URL,
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
