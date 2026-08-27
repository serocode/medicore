import { randomUUID } from "node:crypto";
import type { Db } from "../client.js";
import { user } from "../schema/auth.js";

export async function insertTestUser(db: Db, overrides: Partial<typeof user.$inferInsert> = {}) {
  const [row] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      emailVerified: true,
      ...overrides,
    })
    .returning();
  if (!row) throw new Error("Failed to insert test user");
  return row;
}
