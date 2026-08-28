import { UserAccountNotFoundError } from "../errors.js";
import type { AccountProfile, AccountProfileRepository } from "../ports.js";

export interface UpdateAccountImageDeps {
  accounts: AccountProfileRepository;
}

/**
 * Points the account at a stored image, or clears it.
 *
 * The file itself is written by the route before this runs; this only records
 * where it went. Passing null removes the picture and falls the UI back to the
 * generated initials avatar.
 */
export async function updateAccountImage(
  input: { userId: string; imagePath: string | null },
  deps: UpdateAccountImageDeps,
): Promise<AccountProfile> {
  const existing = await deps.accounts.findById(input.userId);
  if (!existing) {
    throw new UserAccountNotFoundError();
  }
  return deps.accounts.updateImagePath(input.userId, input.imagePath);
}
