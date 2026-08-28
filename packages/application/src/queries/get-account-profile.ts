import { splitLegacyName } from "@healthcare/domain";
import { UserAccountNotFoundError } from "../errors.js";
import type { AccountProfile, AccountProfileRepository } from "../ports.js";

export interface GetAccountProfileDeps {
  accounts: AccountProfileRepository;
}

/**
 * The signed-in person's account details.
 *
 * Accounts created before names were stored in parts have only the single
 * `name` string Better Auth recorded. Rather than showing them empty fields,
 * the parts are derived on read so the Account page can present a best guess
 * for them to correct. Nothing is written back until they save.
 */
export async function getAccountProfile(
  userId: string,
  deps: GetAccountProfileDeps,
): Promise<AccountProfile> {
  const account = await deps.accounts.findById(userId);
  if (!account) {
    throw new UserAccountNotFoundError();
  }

  const hasStructuredName = Boolean(account.firstName || account.lastName);
  if (hasStructuredName) return account;

  const derived = splitLegacyName(account.name);
  return {
    ...account,
    firstName: derived.firstName || null,
    middleName: derived.middleName ?? null,
    lastName: derived.lastName || null,
    suffix: derived.suffix ?? null,
  };
}
