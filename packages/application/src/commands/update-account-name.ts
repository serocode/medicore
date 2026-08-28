import { formatPersonName } from "@healthcare/domain";
import { UserAccountNotFoundError } from "../errors.js";
import type { AccountProfile, AccountProfileRepository } from "../ports.js";

export interface UpdateAccountNameInput {
  userId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}

export interface UpdateAccountNameDeps {
  accounts: AccountProfileRepository;
}

/**
 * Stores the name in parts and keeps the display string in step.
 *
 * The display string is always recomposed here rather than accepted from the
 * caller, so the two can never disagree — every screen that reads `name` shows
 * exactly what the parts say.
 */
export async function updateAccountName(
  input: UpdateAccountNameInput,
  deps: UpdateAccountNameDeps,
): Promise<AccountProfile> {
  const existing = await deps.accounts.findById(input.userId);
  if (!existing) {
    throw new UserAccountNotFoundError();
  }

  const parts = {
    firstName: input.firstName.trim(),
    middleName: input.middleName?.trim() || null,
    lastName: input.lastName.trim(),
    suffix: input.suffix?.trim() || null,
  };

  return deps.accounts.updateName(input.userId, {
    ...parts,
    displayName: formatPersonName(parts),
  });
}
