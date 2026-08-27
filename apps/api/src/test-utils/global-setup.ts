import { TEST_DATABASE_URL, ensureTestDatabase } from "@healthcare/dal/src/test-utils/test-db.js";

export default async function setup() {
  await ensureTestDatabase(TEST_DATABASE_URL);
}
