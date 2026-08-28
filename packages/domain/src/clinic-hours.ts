import { OutsideClinicHoursError } from "./errors.js";

/**
 * When the clinic is open, and therefore when an appointment may be placed.
 *
 * The clinic is in Manila and keeps one set of hours, so these are absolute
 * facts about the business rather than anything the caller's timezone can
 * influence. An appointment requested from anywhere in the world is measured
 * against the same Manila wall clock.
 *
 * The Philippines has observed no daylight saving since 1978 and sits at a
 * fixed UTC+08:00; that is what lets this compare instants using a constant
 * offset. It is the one value that becomes wrong if that ever changes.
 */
const CLINIC_OFFSET_MS = 8 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

/** Appointments start on the hour or the half hour. */
export const CLINIC_SLOT_MINUTES = 30;

/**
 * Monday to Friday, mornings and afternoons, closed over lunch. Expressed as
 * minutes from midnight so the arithmetic below has no string parsing in it.
 */
export const CLINIC_SESSIONS = [
  { opensAt: 8 * 60, closesAt: 12 * 60 },
  { opensAt: 13 * 60, closesAt: 17 * 60 },
] as const;

/** 1 = Monday … 5 = Friday. The clinic does not open at the weekend. */
const CLINIC_WORKING_DAYS = new Set([1, 2, 3, 4, 5]);

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Every start time the clinic accepts, as "HH:MM" in clinic time.
 *
 * A slot must *finish* before the session closes, so the last morning start is
 * 11:30 and the last afternoon start is 16:30 — 12:00 and 17:00 are closing
 * times, not bookable slots.
 */
export function clinicSlotTimes(): string[] {
  const slots: string[] = [];
  for (const session of CLINIC_SESSIONS) {
    for (
      let minute = session.opensAt;
      minute + CLINIC_SLOT_MINUTES <= session.closesAt;
      minute += CLINIC_SLOT_MINUTES
    ) {
      slots.push(formatMinutes(minute));
    }
  }
  return slots;
}

/** The instant's weekday and minute-of-day as they read on the clinic's clock. */
function clinicClock(instant: Date): { weekday: number; minuteOfDay: number } {
  const shifted = new Date(instant.getTime() + CLINIC_OFFSET_MS);
  return {
    weekday: shifted.getUTCDay(),
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function isClinicWorkingDay(instant: Date): boolean {
  return CLINIC_WORKING_DAYS.has(clinicClock(instant).weekday);
}

/** True only for an exact slot start on a day the clinic is open. */
export function isWithinClinicHours(instant: Date): boolean {
  const { weekday, minuteOfDay } = clinicClock(instant);
  if (!CLINIC_WORKING_DAYS.has(weekday)) return false;
  if (minuteOfDay % CLINIC_SLOT_MINUTES !== 0) return false;
  // Guard the day boundary too: a negative or overflowing minute would slip
  // through the session comparison below.
  if (minuteOfDay < 0 || minuteOfDay >= MINUTES_PER_DAY) return false;
  return CLINIC_SESSIONS.some(
    (session) =>
      minuteOfDay >= session.opensAt && minuteOfDay + CLINIC_SLOT_MINUTES <= session.closesAt,
  );
}

/**
 * The single guard the application layer calls. Rejecting here rather than
 * only in the booking form is the point: the form can be bypassed, and an
 * appointment placed at 03:00 on a Sunday is not something the clinic can
 * honour.
 */
export function assertWithinClinicHours(instant: Date): void {
  if (!isWithinClinicHours(instant)) {
    throw new OutsideClinicHoursError();
  }
}

/** Human-readable summary, used in error messages and the booking form. */
export function describeClinicHours(): string {
  const sessions = CLINIC_SESSIONS.map(
    (session) => `${formatMinutes(session.opensAt)}–${formatMinutes(session.closesAt)}`,
  ).join(" and ");
  return `Monday to Friday, ${sessions} Philippine time, in ${CLINIC_SLOT_MINUTES}-minute slots`;
}
