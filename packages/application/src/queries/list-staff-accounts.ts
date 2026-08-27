import type { StaffAccountRepository, StaffInvite, UserAccount } from "../ports.js";

export interface StaffAccountsOverview {
  accounts: UserAccount[];
  pendingInvites: StaffInvite[];
}

export async function listStaffAccounts(deps: {
  accounts: StaffAccountRepository;
}): Promise<StaffAccountsOverview> {
  const [accounts, pendingInvites] = await Promise.all([
    deps.accounts.listStaffAndAdmins(),
    deps.accounts.listInvites(),
  ]);
  return { accounts, pendingInvites };
}
