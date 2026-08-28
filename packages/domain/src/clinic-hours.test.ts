import { describe, expect, it } from "vitest";
import {
  assertWithinClinicHours,
  clinicSlotTimes,
  isClinicWorkingDay,
  isWithinClinicHours,
} from "./clinic-hours.js";
import { OutsideClinicHoursError } from "./errors.js";

/**
 * Every instant here is written in UTC with the Manila reading in a comment,
 * because that is the whole point of the rule: the clinic's clock decides, not
 * the caller's. Manila is UTC+8, so 02:00Z is 10:00 in Manila.
 *
 * 2 Nov 2026 is a Monday; 7 Nov 2026 is a Saturday.
 */
const manila = (utc: string) => new Date(utc);

describe("clinicSlotTimes", () => {
  it("covers both sessions in half-hour steps", () => {
    expect(clinicSlotTimes()).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ]);
  });

  it("stops early enough that every slot finishes before the session closes", () => {
    const slots = clinicSlotTimes();
    // 12:00 and 17:00 are closing times, not startable slots.
    expect(slots).not.toContain("12:00");
    expect(slots).not.toContain("17:00");
    expect(slots.at(-1)).toBe("16:30");
  });

  it("excludes the lunch break", () => {
    expect(clinicSlotTimes()).not.toContain("12:30");
  });
});

describe("isWithinClinicHours", () => {
  it("accepts a slot start inside either session", () => {
    expect(isWithinClinicHours(manila("2026-11-02T00:00:00Z"))).toBe(true); // Mon 08:00
    expect(isWithinClinicHours(manila("2026-11-02T03:30:00Z"))).toBe(true); // Mon 11:30
    expect(isWithinClinicHours(manila("2026-11-02T05:00:00Z"))).toBe(true); // Mon 13:00
    expect(isWithinClinicHours(manila("2026-11-02T08:30:00Z"))).toBe(true); // Mon 16:30
  });

  it("rejects the closing times themselves", () => {
    expect(isWithinClinicHours(manila("2026-11-02T04:00:00Z"))).toBe(false); // Mon 12:00
    expect(isWithinClinicHours(manila("2026-11-02T09:00:00Z"))).toBe(false); // Mon 17:00
  });

  it("rejects the lunch break", () => {
    expect(isWithinClinicHours(manila("2026-11-02T04:30:00Z"))).toBe(false); // Mon 12:30
  });

  it("rejects before opening and after closing", () => {
    expect(isWithinClinicHours(manila("2026-11-01T23:30:00Z"))).toBe(false); // Mon 07:30
    expect(isWithinClinicHours(manila("2026-11-02T10:00:00Z"))).toBe(false); // Mon 18:00
    expect(isWithinClinicHours(manila("2026-11-02T19:00:00Z"))).toBe(false); // Tue 03:00
  });

  it("rejects a time that isn't on a half hour", () => {
    expect(isWithinClinicHours(manila("2026-11-02T02:15:00Z"))).toBe(false); // Mon 10:15
    expect(isWithinClinicHours(manila("2026-11-02T02:01:00Z"))).toBe(false); // Mon 10:01
  });

  it("rejects the weekend even at a time that would otherwise be valid", () => {
    expect(isWithinClinicHours(manila("2026-11-07T02:00:00Z"))).toBe(false); // Sat 10:00
    expect(isWithinClinicHours(manila("2026-11-08T02:00:00Z"))).toBe(false); // Sun 10:00
  });

  it("judges by the clinic's calendar, not UTC's", () => {
    // Sunday 18:00 UTC is already Monday 02:00 in Manila — a working day, but
    // long before opening.
    expect(isClinicWorkingDay(manila("2026-11-01T18:00:00Z"))).toBe(true);
    expect(isWithinClinicHours(manila("2026-11-01T18:00:00Z"))).toBe(false);

    // Friday 23:00 UTC is Saturday 07:00 in Manila — the clinic is shut, even
    // though UTC still says Friday.
    expect(isClinicWorkingDay(manila("2026-11-06T23:00:00Z"))).toBe(false);

    // Monday 00:00 UTC is Monday 08:00 in Manila — the first slot of the week.
    expect(isWithinClinicHours(manila("2026-11-02T00:00:00Z"))).toBe(true);
  });
});

describe("assertWithinClinicHours", () => {
  it("passes a valid slot through silently", () => {
    expect(() => assertWithinClinicHours(manila("2026-11-02T02:00:00Z"))).not.toThrow();
  });

  it("throws OutsideClinicHoursError for a weekend request", () => {
    expect(() => assertWithinClinicHours(manila("2026-11-07T02:00:00Z"))).toThrow(
      OutsideClinicHoursError,
    );
  });
});
