import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one real Postgres test database — running
    // files in parallel would race each other's truncate/insert calls.
    fileParallelism: false,
  },
});
