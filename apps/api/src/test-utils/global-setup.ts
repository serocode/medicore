import { rm } from "node:fs/promises";
import path from "node:path";
import { TEST_DATABASE_URL, ensureTestDatabase } from "@healthcare/dal/src/test-utils/test-db.js";

// UPLOAD_DIR is set to ./uploads-test by vitest.config.ts. Nothing ever removed
// it between runs, so every run's scratch uploads accumulated there (8MB and
// ~2000 files before this was added). Wiping it up front — rather than on
// teardown — both bounds the growth and guarantees the upload routes start
// each run against an empty directory, while still leaving the last run's
// files on disk to inspect when something fails.
const SCRATCH_UPLOAD_DIR = "uploads-test";

async function resetScratchUploads(): Promise<void> {
  const configured = process.env.UPLOAD_DIR ?? `./${SCRATCH_UPLOAD_DIR}`;
  // Guard against ever pointing this at the real ./uploads directory that
  // holds patient ID documents in dev.
  if (path.basename(configured) !== SCRATCH_UPLOAD_DIR) {
    throw new Error(
      `Refusing to clear UPLOAD_DIR "${configured}": expected a directory named "${SCRATCH_UPLOAD_DIR}".`,
    );
  }
  await rm(configured, { recursive: true, force: true });
}

export default async function setup() {
  await resetScratchUploads();
  await ensureTestDatabase(TEST_DATABASE_URL);
}
