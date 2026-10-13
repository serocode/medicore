import {
  type UserAccount,
  inviteStaffAccount,
  listStaffAccounts,
  revokeStaffInvite,
  setStaffAccountStatus,
  updateStaffAccountRole,
} from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import { sendStaffInviteEmail } from "../email.js";
import { requireAdmin } from "../middleware/require-admin.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { doctorRepository, nurseRepository, staffAccountRepository } from "../repos.js";

export const adminRoute = new Hono<{ Variables: AuthVariables }>();

adminRoute.use("*", requireAuth, requireAdmin);

adminRoute.get("/staff", async (c) => {
  const overview = await listStaffAccounts({ accounts: staffAccountRepository });
  return c.json(overview);
});

const updateAccountSchema = z
  .object({
    role: z.enum(["patient", "doctor", "nurse", "admin"]).optional(),
    disabled: z.boolean().optional(),
  })
  .refine((body) => body.role !== undefined || body.disabled !== undefined, {
    message: "role or disabled is required",
  });

adminRoute.patch("/staff/:userId", async (c) => {
  const actingUserId = c.get("user").id;
  const targetUserId = c.req.param("userId");
  const input = updateAccountSchema.parse(await c.req.json());

  let account: UserAccount | undefined;

  if (input.role !== undefined) {
    account = await updateStaffAccountRole(
      { targetUserId, actingUserId, role: input.role },
      { accounts: staffAccountRepository, doctors: doctorRepository, nurses: nurseRepository },
    );
  }
  if (input.disabled !== undefined) {
    account = await setStaffAccountStatus(
      { targetUserId, actingUserId, disabled: input.disabled },
      { accounts: staffAccountRepository },
    );
  }

  return c.json({ account });
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["doctor", "nurse", "admin"]),
});

adminRoute.post("/invites", async (c) => {
  const user = c.get("user");
  const input = inviteSchema.parse(await c.req.json());

  const invite = await inviteStaffAccount(
    { email: input.email, role: input.role, invitedByUserId: user.id },
    { accounts: staffAccountRepository },
  );

  // Best-effort, like appointment notifications: the invite is already saved
  // and works without the email (the role applies whenever that address signs
  // in), so a delivery failure is reported back rather than undoing it.
  let emailSent = true;
  try {
    await sendStaffInviteEmail(invite.email, invite.role);
  } catch (error) {
    console.error("Failed to send staff invite email:", error);
    emailSent = false;
  }

  return c.json({ invite, emailSent }, 201);
});

adminRoute.delete("/invites/:email", async (c) => {
  await revokeStaffInvite(decodeURIComponent(c.req.param("email")), {
    accounts: staffAccountRepository,
  });
  return c.body(null, 204);
});
