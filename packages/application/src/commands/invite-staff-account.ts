import type { StaffAccountRepository, StaffInvite } from "../ports.js";

export interface InviteStaffAccountInput {
  email: string;
  role: "doctor" | "nurse" | "admin";
  invitedByUserId: string;
}

export interface InviteStaffAccountDeps {
  accounts: StaffAccountRepository;
}

// Doesn't create a user — Better Auth only creates one at first sign-in
// (this app is OTP-only, there's no separate "create account" step to hook
// into). Recording the invite here means the role is ready and waiting the
// moment that email does sign in; see the sign-up hook in apps/api/src/auth.ts.
export async function inviteStaffAccount(
  input: InviteStaffAccountInput,
  deps: InviteStaffAccountDeps,
): Promise<StaffInvite> {
  return deps.accounts.createInvite({
    email: input.email.toLowerCase(),
    role: input.role,
    invitedByUserId: input.invitedByUserId,
  });
}
