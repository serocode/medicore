import type { AccountProfile, AccountProfileRepository } from "@healthcare/application";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { user } from "../schema/auth.js";

function toAccountProfile(row: typeof user.$inferSelect): AccountProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    suffix: row.suffix,
    imagePath: row.image,
  };
}

/**
 * The signed-in person's own account row.
 *
 * Writes to Better Auth's `user` table directly, the same way
 * DrizzleStaffAccountRepository already does for role and disabled state —
 * Better Auth owns the auth flow, not exclusive ownership of the table.
 */
export class DrizzleAccountProfileRepository implements AccountProfileRepository {
  constructor(private db: Db) {}

  async findById(userId: string): Promise<AccountProfile | null> {
    const [row] = await this.db.select().from(user).where(eq(user.id, userId));
    return row ? toAccountProfile(row) : null;
  }

  async updateName(
    userId: string,
    name: {
      displayName: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffix: string | null;
    },
  ): Promise<AccountProfile> {
    const [row] = await this.db
      .update(user)
      .set({
        name: name.displayName,
        firstName: name.firstName,
        middleName: name.middleName,
        lastName: name.lastName,
        suffix: name.suffix,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();
    if (!row) throw new Error("Failed to update account name");
    return toAccountProfile(row);
  }

  async updateImagePath(userId: string, imagePath: string | null): Promise<AccountProfile> {
    const [row] = await this.db
      .update(user)
      .set({ image: imagePath, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    if (!row) throw new Error("Failed to update account image");
    return toAccountProfile(row);
  }
}
