import { clinicInputToIso, clinicToday } from "@/shared/lib/timezone";

/**
 * The clinic's opening hours, for the booking UI.
 *
 * Mirrors packages/domain/src/clinic-hours.ts, which is authoritative and
 * rejects anything outside these hours regardless of what the form allows.
 * This copy exists because apps/web deliberately has no dependency on the
 * domain package — the same arrangement already used for the text length and
 * upload size limits. If the clinic's hours change, both files change.
 */
const SLOT_MINUTES = 30;
const SESSIONS = [
  { opensAt: 8 * 60, closesAt: 12 * 60 },
  { opensAt: 13 * 60, closesAt: 17 * 60 },
];
const WORKING_DAYS = new Set([1, 2, 3, 4, 5]);

export const CLINIC_HOURS_SUMMARY = "Monday to Friday, 8:00 AM – 12:00 PM and 1:00 PM – 5:00 PM";

function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Every start time the clinic accepts, "HH:MM" in clinic time. */
export function clinicSlotTimes(): string[] {
  const slots: string[] = [];
  for (const session of SESSIONS) {
    for (
      let minute = session.opensAt;
      minute + SLOT_MINUTES <= session.closesAt;
      minute += SLOT_MINUTES
    ) {
      slots.push(formatMinutes(minute));
    }
  }
  return slots;
}

/**
 * Whether the clinic opens on a calendar date.
 *
 * The date arrives as a bare YYYY-MM-DD from a date input, so it is parsed as
 * UTC midnight purely to read its weekday — a calendar weekday is the same
 * number whatever timezone you ask in, and going through a Manila offset here
 * would land on the previous day.
 */
export function isClinicWorkingDay(date: string): boolean {
  if (!date) return false;
  return WORKING_DAYS.has(new Date(`${date}T00:00:00Z`).getUTCDay());
}

/**
 * The slots still bookable on a given date: all of them, minus any that have
 * already passed when the date is today in Manila. Offering a slot the server
 * will refuse as being in the past is worse than not offering it.
 */
export function availableSlotTimes(date: string): string[] {
  const slots = clinicSlotTimes();
  if (!date || !isClinicWorkingDay(date)) return [];
  if (date !== clinicToday()) return slots;

  const now = Date.now();
  return slots.filter((time) => new Date(clinicInputToIso(`${date}T${time}`)).getTime() > now);
}

/** "14:30" -> "2:30 PM", so the dropdown reads the way the clinic speaks. */
export function formatSlotLabel(time: string): string {
  const [hours = "0", minutes = "00"] = time.split(":");
  const hour = Number(hours);
  const suffix = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minutes} ${suffix}`;
}
