import { defineConfig } from "vitest/config";

// The DAL and API suites both truncate every table, so they cannot share a
// database: Turbo runs their `test` tasks in parallel and one suite's
// `truncateAll` would wipe rows the other was mid-assertion on (a foreign-key
// violation surfacing in whichever suite lost the race). Each package gets its
// own database instead, so the two stay parallel-safe.
const DAL_TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_test_dal";

export default defineConfig({
  test: {
    // Integration tests share one real Postgres test database — running
    // files in parallel would race each other's truncate/insert calls.
    fileParallelism: false,
    // test-db.ts reads TEST_DATABASE_URL at import time, so it has to be in
    // the environment before the test modules load.
    env: {
      TEST_DATABASE_URL: DAL_TEST_DATABASE_URL,
    },
  },
});
