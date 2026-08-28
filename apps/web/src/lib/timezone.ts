/**
 * Medicore runs a single clinic in Manila, so every date and time in the
 * product is clinic time — never the viewer's local time. A nurse checking
 * the schedule from a laptop still set to another timezone must see the same
 * "09:15" the patient was told, and an appointment entered as 10:00 must mean
 * 10:00 in Manila regardless of where it was typed.
 *
 * Two directions matter and they need different tools:
 *
 *  - Rendering an instant (a stored timestamp) as clinic wall-clock time:
 *    `Intl` with `timeZone`, which stays correct even if the offset rules
 *    ever change.
 *  - Turning clinic wall-clock text (what someone typed into a date or
 *    datetime-local input, which the browser hands over with no zone) back
 *    into an instant: this needs an offset, so it uses the constant below.
 *
 * The Philippines has observed no daylight saving since 1978 and sits at a
 * fixed UTC+08:00, which is what makes the constant safe. If that ever
 * changes, `CLINIC_UTC_OFFSET` is the single place that becomes wrong.
 */
export const CLINIC_TIME_ZONE = "Asia/Manila";

/**
 * Dates are written the clinic's way, not the viewer's. Pinning the locale as
 * well as the timezone means a US-configured browser and a UK-configured one
 * produce the identical string — otherwise the same appointment reads
 * "Sep 15, 2026" for one member of staff and "15 Sept 2026" for another.
 *
 * `en` is listed as a fallback for runtimes shipped without en-PH data; Intl
 * takes the first entry it supports.
 */
export const CLINIC_LOCALE = ["en-PH", "en"];

/**
 * Shown wherever someone types a time. `datetime-local` carries no timezone,
 * so a booker in another country types "10:00" meaning their own 10:00 and
 * silently gets 10:00 in Manila. The value stored is right either way — this
 * is so the person knows the rule before they commit to a slot.
 */
export const CLINIC_TIME_ZONE_LABEL = "Philippine time (GMT+8)";
const CLINIC_UTC_OFFSET = "+08:00";
const CLINIC_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * The clinic's wall-clock reading of an instant, as UTC-looking parts.
 *
 * Shifting by the offset and then reading the UTC getters is a deliberate
 * trick: it gives a Date whose *UTC* fields equal Manila's *local* fields, so
 * `toISOString().slice(...)` yields exactly the `YYYY-MM-DDTHH:mm` shape the
 * HTML date inputs want. The returned Date is not a real instant — never
 * store or compare it, only read its parts.
 */
function asClinicWallClock(instant: Date): Date {
  return new Date(instant.getTime() + CLINIC_OFFSET_MS);
}

/** `YYYY-MM-DD` for today in Manila — for a date input's `min`/`max`. */
export function clinicToday(): string {
  return asClinicWallClock(new Date()).toISOString().slice(0, 10);
}

/** `YYYY-MM-DDTHH:mm` for now in Manila — for a datetime-local `min`. */
export function clinicNowForDateTimeInput(): string {
  return asClinicWallClock(new Date()).toISOString().slice(0, 16);
}

/**
 * Reads a date input's value as clinic time and returns the real instant.
 *
 * `datetime-local` and `date` inputs hand back bare wall-clock text with no
 * zone, and `new Date(text)` would resolve it against whatever timezone the
 * browser happens to be in. Pinning the offset is what makes "10:00" mean
 * 10:00 in Manila no matter where it was typed.
 */
export function clinicInputToIso(value: string): string {
  // `date` gives YYYY-MM-DD (treat as midnight clinic time); `datetime-local`
  // gives YYYY-MM-DDTHH:mm, and YYYY-MM-DDTHH:mm:ss when the step allows
  // seconds. Normalise all three to a full local timestamp before pinning the
  // offset.
  let wallClock = value;
  if (value.length === 10) wallClock = `${value}T00:00:00`;
  else if (value.length === 16) wallClock = `${value}:00`;
  return new Date(`${wallClock}${CLINIC_UTC_OFFSET}`).toISOString();
}

/** The calendar parts of an instant as they read in Manila. */
export function clinicDateParts(value: string | Date): {
  year: number;
  month: number;
  day: number;
} {
  const shifted = asClinicWallClock(new Date(value));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}
