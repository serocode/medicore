import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const staffInviteRoleEnum = pgEnum("staff_invite_role", ["doctor", "nurse", "admin"]);

// Replaces the env-var allowlist as the *runtime* way to grant a role: an
// admin invites an email to a role here, and the existing sign-up hook (see
// apps/api/src/auth.ts) assigns it the first time that email signs in, then
// deletes the row. The env allowlists still work too (checked first) so
// existing deployments aren't broken.
export const staffInvite = pgTable("staff_invite", {
  email: text("email").primaryKey(),
  role: staffInviteRoleEnum("role").notNull(),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
