/**
 * A person's name, stored in parts.
 *
 * The parts are the source of truth; the single display string is derived from
 * them. Storing only a display string would mean guessing where a surname
 * begins every time one component needed editing — which is exactly the kind
 * of split that loses data for names that don't follow one convention.
 *
 * Only `firstName` and `lastName` are required. A middle name is common but
 * far from universal, and a suffix is rare.
 */
export interface PersonName {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}

/** Suffixes the account form offers. Free text would invite "Jr" vs "Jr." drift. */
export const NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"] as const;

export type NameSuffix = (typeof NAME_SUFFIXES)[number];

/**
 * The display string every other part of the product reads.
 *
 * "Maria Cruz Santos Jr." — parts joined in reading order, blanks dropped. The
 * suffix is appended without a comma; both styles are current, and the
 * comma-less form composes more predictably when a middle name is absent.
 */
export function formatPersonName(name: PersonName): string {
  return [name.firstName, name.middleName, name.lastName, name.suffix]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

/**
 * Best-effort split of a legacy single-string name into parts.
 *
 * Only for accounts created before names were stored in parts — a person who
 * signed in by one-time code and never filled in a profile has whatever
 * Better Auth recorded, which may be anything or nothing. It deliberately does
 * not try to be clever: the first token is the first name, a trailing
 * recognised suffix is lifted out, the last remaining token is the surname,
 * and anything between becomes the middle name. Whatever it produces is shown
 * to the person for correction rather than saved behind their back.
 */
export function splitLegacyName(fullName: string): PersonName {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { firstName: "", lastName: "" };

  let suffix: string | null = null;
  const last = tokens.at(-1);
  if (
    tokens.length > 2 &&
    last &&
    NAME_SUFFIXES.some(
      (candidate) => candidate.toLowerCase() === last.toLowerCase().replace(/\.$/, "."),
    )
  ) {
    suffix = NAME_SUFFIXES.find((c) => c.toLowerCase() === last.toLowerCase()) ?? last;
    tokens.pop();
  }

  if (tokens.length === 1) return { firstName: tokens[0] ?? "", lastName: "", suffix };

  const firstName = tokens[0] ?? "";
  const lastName = tokens.at(-1) ?? "";
  const middleName = tokens.slice(1, -1).join(" ") || null;
  return { firstName, middleName, lastName, suffix };
}
