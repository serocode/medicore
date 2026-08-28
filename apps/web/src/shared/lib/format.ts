// One place for date wording, so "12 Mar 2026, 09:15" reads the same in the
// patient's list, the admin's table, and the clinical timeline.
//
// Every formatter is pinned to clinic time. Medicore serves one clinic in
// Manila, so a timestamp must read the same whatever timezone the viewer's
// machine is set to — otherwise a nurse travelling, or a patient whose laptop
// clock is wrong, sees a different appointment time from the one the clinic
// confirmed. The locale is pinned for the same reason: two people looking at
// the same record should read the same string, not "Sep 15" and "15 Sept".

import { CLINIC_LOCALE, CLINIC_TIME_ZONE, clinicDateParts } from "@/shared/lib/timezone";

const DATE_TIME = new Intl.DateTimeFormat(CLINIC_LOCALE, {
  timeZone: CLINIC_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat(CLINIC_LOCALE, {
  timeZone: CLINIC_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const WEEKDAY_TIME = new Intl.DateTimeFormat(CLINIC_LOCALE, {
  timeZone: CLINIC_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const WEEKDAY_TIME_YEAR = new Intl.DateTimeFormat(CLINIC_LOCALE, {
  timeZone: CLINIC_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  return DATE_TIME.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return DATE_ONLY.format(new Date(value));
}

/**
 * For schedules, where the day of the week is what someone is scanning for.
 * The year appears only when it isn't the current one — without it, a booking
 * in a later year reads as a date that has already passed.
 */
export function formatWeekdayTime(value: string | Date): string {
  const date = new Date(value);
  return clinicDateParts(date).year === clinicDateParts(new Date()).year
    ? WEEKDAY_TIME.format(date)
    : WEEKDAY_TIME_YEAR.format(date);
}

// Patients type their own allergies, and plenty write "None" or "N/A" rather
// than leaving the box empty. Rendering that as a red allergy warning is worse
// than useless in a clinical view, so treat the common negatives as blank.
const NO_ALLERGY_ANSWERS = new Set([
  "none",
  "n/a",
  "na",
  "nil",
  "no",
  "no known allergies",
  "nka",
  "none known",
  "no allergies",
]);

/** The allergy text worth alerting on, or null when there's nothing to flag. */
export function significantAllergies(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return NO_ALLERGY_ANSWERS.has(trimmed.toLowerCase().replace(/[.\s]+$/, "")) ? null : trimmed;
}

/** Accounts created by OTP sign-in can have an empty name until they register. */
export function displayName(name: string | null | undefined, fallback = "Unnamed patient"): string {
  return name?.trim() || fallback;
}

/**
 * True when the timestamp falls on today's date *in clinic time*. Comparing
 * the viewer's local calendar would mark the wrong appointments as "Today"
 * for anyone whose machine isn't on Manila time.
 */
export function isToday(value: string | Date): boolean {
  const date = clinicDateParts(value);
  const now = clinicDateParts(new Date());
  return date.year === now.year && date.month === now.month && date.day === now.day;
}

/**
 * Blood pressure as one value. The overview card used to render "—/80" while
 * the history table showed a single "—" for the same partially-recorded
 * reading; a clinician comparing the two screens saw two different facts.
 * A half-recorded BP is not a BP, so both now show one dash.
 */
export function formatBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): string {
  if (systolic == null || diastolic == null) return "—";
  return `${systolic}/${diastolic}`;
}

/** A single vital reading, or an em dash when it wasn't taken. */
export function formatVital(value: number | null | undefined, unit?: string): string {
  if (value == null) return "—";
  return unit ? `${value} ${unit}` : String(value);
}
