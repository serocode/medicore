import { CannotModifyOwnAccountError, UserAccountNotFoundError } from "../errors.js";
import type { StaffAccountRepository, UserAccount } from "../ports.js";

export interface SetStaffAccountStatusInput {
  targetUserId: string;
  actingUserId: string;
  disabled: boolean;
}

export interface SetStaffAccountStatusDeps {
  accounts: StaffAccountRepository;
}

export async function setStaffAccountStatus(
  input: SetStaffAccountStatusInput,
  deps: SetStaffAccountStatusDeps,
): Promise<UserAccount> {
  if (input.targetUserId === input.actingUserId) {
    throw new CannotModifyOwnAccountError();
  }

  const target = await deps.accounts.findById(input.targetUserId);
  if (!target) {
    throw new UserAccountNotFoundError();
  }

  const account = await deps.accounts.setDisabled(target.id, input.disabled);
  if (input.disabled) {
    await deps.accounts.revokeSessions(target.id);
  }
  return account;
}
