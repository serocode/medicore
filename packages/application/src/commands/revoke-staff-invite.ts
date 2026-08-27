import type { StaffAccountRepository } from "../ports.js";

export async function revokeStaffInvite(
  email: string,
  deps: { accounts: StaffAccountRepository },
): Promise<void> {
  await deps.accounts.deleteInvite(email.toLowerCase());
}
