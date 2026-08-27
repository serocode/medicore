import type {
  NewStaffInvite,
  StaffAccountRepository,
  StaffInvite,
  UserAccount,
  UserAccountRole,
} from "@healthcare/application";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "../client.js";
import { session, user } from "../schema/auth.js";
import { staffInvite } from "../schema/staff-invite.js";

function toUserAccount(row: typeof user.$inferSelect): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserAccountRole,
    disabledAt: row.disabledAt,
    createdAt: row.createdAt,
  };
}

function toStaffInvite(row: typeof staffInvite.$inferSelect): StaffInvite {
  return {
    email: row.email,
    role: row.role,
    invitedByUserId: row.invitedByUserId,
    createdAt: row.createdAt,
  };
}

export class DrizzleStaffAccountRepository implements StaffAccountRepository {
  constructor(private db: Db) {}

  async listStaffAndAdmins(): Promise<UserAccount[]> {
    const rows = await this.db
      .select()
      .from(user)
      .where(inArray(user.role, ["doctor", "nurse", "admin"]));
    return rows.map(toUserAccount);
  }

  async findById(userId: string): Promise<UserAccount | null> {
    const [row] = await this.db.select().from(user).where(eq(user.id, userId));
    return row ? toUserAccount(row) : null;
  }

  async updateRole(userId: string, role: UserAccountRole): Promise<UserAccount> {
    const [row] = await this.db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    if (!row) throw new Error("Failed to update account role");
    return toUserAccount(row);
  }

  async setDisabled(userId: string, disabled: boolean): Promise<UserAccount> {
    const [row] = await this.db
      .update(user)
      .set({ disabledAt: disabled ? new Date() : null, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    if (!row) throw new Error("Failed to update account status");
    return toUserAccount(row);
  }

  async revokeSessions(userId: string): Promise<void> {
    await this.db.delete(session).where(eq(session.userId, userId));
  }

  async listInvites(): Promise<StaffInvite[]> {
    const rows = await this.db.select().from(staffInvite);
    return rows.map(toStaffInvite);
  }

  async findInvite(email: string): Promise<StaffInvite | null> {
    const [row] = await this.db
      .select()
      .from(staffInvite)
      .where(eq(staffInvite.email, email.toLowerCase()));
    return row ? toStaffInvite(row) : null;
  }

  async createInvite(invite: NewStaffInvite): Promise<StaffInvite> {
    const [row] = await this.db
      .insert(staffInvite)
      .values({ ...invite, email: invite.email.toLowerCase() })
      .onConflictDoUpdate({
        target: staffInvite.email,
        set: { role: invite.role, invitedByUserId: invite.invitedByUserId },
      })
      .returning();
    if (!row) throw new Error("Failed to create staff invite");
    return toStaffInvite(row);
  }

  async deleteInvite(email: string): Promise<void> {
    await this.db.delete(staffInvite).where(eq(staffInvite.email, email.toLowerCase()));
  }
}
