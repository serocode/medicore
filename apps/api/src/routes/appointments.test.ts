import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import {
  signInAsAdmin,
  signInAsDoctor,
  signInAsNurse,
  signInAsPatient,
} from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient } from "../test-utils/register-patient.js";

interface AppointmentResponse {
  appointment: { id: string; status: string };
}
interface StatsResponse {
  stats: { pending: number; scheduled: number; cancelled: number };
}
interface AppointmentsListResponse {
  appointments: unknown[];
}

let doctorId: string;

beforeEach(async () => {
  await truncateAll(db);
  // truncateAll wipes `doctor` too (it now has a live FK to `user`), so the
  // fixture doctor must be re-seeded — and re-captured — every time.
  doctorId = (await ensureTestDoctor(db)).id;
});

async function bookAppointment(cookie: string, overrides: Record<string, unknown> = {}) {
  return app.request("/api/appointments", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      doctorId,
      reason: "Checkup",
      preferredSchedule: "2026-11-02T02:00:00Z",
      ...overrides,
    }),
  });
}

async function bookedAppointment(cookie: string, overrides: Record<string, unknown> = {}) {
  const res = await bookAppointment(cookie, overrides);
  return (await readJson<AppointmentResponse>(res)).appointment;
}

describe("POST /api/appointments", () => {
  it("requires a registered patient profile", async () => {
    const cookie = await signInAsPatient(app, "unregistered@example.com");
    const res = await bookAppointment(cookie);
    expect(res.status).toBe(404);
  });

  it("books an appointment for a registered patient", async () => {
    const cookie = await signInAsPatient(app, "booker@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const res = await bookAppointment(cookie);
    expect(res.status).toBe(201);
    const body = await readJson<AppointmentResponse>(res);
    expect(body.appointment.status).toBe("pending");
  });
});

describe("clinic opening hours", () => {
  // Manila is UTC+8, so 02:00Z is 10:00 clinic time. 2 Nov 2026 is a Monday,
  // 7 Nov 2026 a Saturday.
  // `label` keeps each case on its own account without putting an ISO
  // timestamp — colons and all — into an email local part, which is invalid.
  async function attempt(label: string, preferredSchedule: string) {
    const cookie = await signInAsPatient(app, `hours-${label}@example.com`);
    await registerTestPatient(app, { cookie, doctorId });
    return bookAppointment(cookie, { preferredSchedule });
  }

  it("accepts a slot inside opening hours", async () => {
    expect((await attempt("inside", "2026-11-02T02:00:00Z")).status).toBe(201); // Mon 10:00
  });

  it("refuses a weekend request", async () => {
    expect((await attempt("weekend", "2026-11-07T02:00:00Z")).status).toBe(400); // Sat 10:00
  });

  it("refuses a time outside opening hours", async () => {
    expect((await attempt("after-hours", "2026-11-02T19:00:00Z")).status).toBe(400); // Tue 03:00
  });

  it("refuses the lunch break", async () => {
    expect((await attempt("lunch", "2026-11-02T04:30:00Z")).status).toBe(400); // Mon 12:30
  });

  it("refuses a time that isn't on a half hour", async () => {
    expect((await attempt("off-grid", "2026-11-02T02:15:00Z")).status).toBe(400); // Mon 10:15
  });

  it("refuses a date in the past, which the form only guarded client-side", async () => {
    expect((await attempt("past", "2020-11-02T02:00:00Z")).status).toBe(400);
  });

  it("refuses an administrator confirming outside opening hours", async () => {
    const cookie = await signInAsPatient(app, "hours-confirm@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);
    const adminCookie = await signInAsAdmin(app);

    const res = await app.request(`/api/appointments/${appointment.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-07T02:00:00Z" }), // Sat 10:00
    });
    expect(res.status).toBe(400);
  });
});

describe("appointment confirm/cancel authorization and business rules", () => {
  it("rejects a patient trying to confirm (admin-only)", async () => {
    const cookie = await signInAsPatient(app, "patient-confirm@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);

    const res = await app.request(`/api/appointments/${appointment.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-02T06:00:00Z" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets an admin confirm, then rejects a conflicting double-booking", async () => {
    const cookieA = await signInAsPatient(app, "double-a@example.com");
    await registerTestPatient(app, { cookie: cookieA, doctorId });
    const appointmentA = await bookedAppointment(cookieA);

    const adminCookie = await signInAsAdmin(app);
    const confirmA = await app.request(`/api/appointments/${appointmentA.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-02T06:00:00Z" }),
    });
    expect(confirmA.status).toBe(200);

    const cookieB = await signInAsPatient(app, "double-b@example.com");
    await registerTestPatient(app, { cookie: cookieB, doctorId });
    const appointmentB = await bookedAppointment(cookieB, {
      preferredSchedule: "2026-11-03T02:00:00Z",
    });

    const conflictRes = await app.request(`/api/appointments/${appointmentB.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-02T06:00:00Z" }),
    });
    expect(conflictRes.status).toBe(409);
  });

  it("rejects cancellation without a reason, accepts one with a reason", async () => {
    const cookie = await signInAsPatient(app, "cancel-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);
    const adminCookie = await signInAsAdmin(app);

    const badCancel = await app.request(`/api/appointments/${appointment.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "" }),
    });
    expect(badCancel.status).toBe(400);

    const goodCancel = await app.request(`/api/appointments/${appointment.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Doctor unavailable" }),
    });
    expect(goodCancel.status).toBe(200);
    expect((await readJson<AppointmentResponse>(goodCancel)).appointment.status).toBe("cancelled");
  });

  it("lets a patient cancel their own appointment", async () => {
    const cookie = await signInAsPatient(app, "self-cancel@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);

    const res = await app.request(`/api/appointments/${appointment.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Can no longer make this time" }),
    });
    expect(res.status).toBe(200);
    expect((await readJson<AppointmentResponse>(res)).appointment.status).toBe("cancelled");
  });

  it("hides another patient's appointment from a cancel attempt", async () => {
    const ownerCookie = await signInAsPatient(app, "cancel-owner@example.com");
    await registerTestPatient(app, { cookie: ownerCookie, doctorId });
    const appointment = await bookedAppointment(ownerCookie);

    const otherCookie = await signInAsPatient(app, "cancel-other@example.com");
    await registerTestPatient(app, { cookie: otherCookie, doctorId });

    const res = await app.request(`/api/appointments/${appointment.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: otherCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Not mine to cancel" }),
    });
    // 404, not 403 — a 403 would confirm the id exists.
    expect(res.status).toBe(404);
  });

  it("refuses a cancel from clinical staff, who have no cancellation workflow", async () => {
    const cookie = await signInAsPatient(app, "cancel-staff-victim@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);

    const doctorCookie = await signInAsDoctor(app);
    const res = await app.request(`/api/appointments/${appointment.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Should not be allowed" }),
    });
    expect(res.status).toBe(404);
  });

  it("reflects confirmed/cancelled counts in /stats (admin-only)", async () => {
    const cookie = await signInAsPatient(app, "stats-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);
    const adminCookie = await signInAsAdmin(app);

    await app.request(`/api/appointments/${appointment.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-02T06:00:00Z" }),
    });

    const patientStats = await app.request("/api/appointments/stats", {
      headers: { Cookie: cookie },
    });
    expect(patientStats.status).toBe(403);

    const adminStats = await app.request("/api/appointments/stats", {
      headers: { Cookie: adminCookie },
    });
    expect(adminStats.status).toBe(200);
    const { stats } = await readJson<StatsResponse>(adminStats);
    expect(stats.scheduled).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/appointments cross-user isolation", () => {
  it("never returns another patient's appointments", async () => {
    const cookieA = await signInAsPatient(app, "iso-a@example.com");
    await registerTestPatient(app, { cookie: cookieA, doctorId });
    await bookAppointment(cookieA);

    const cookieB = await signInAsPatient(app, "iso-b@example.com");
    await registerTestPatient(app, { cookie: cookieB, doctorId });

    const res = await app.request("/api/appointments", { headers: { Cookie: cookieB } });
    const { appointments } = await readJson<AppointmentsListResponse>(res);
    expect(appointments).toHaveLength(0);
  });

  it("gives a doctor only the appointments booked with them", async () => {
    // Signing in provisions this doctor's own profile, which is a different
    // record from the fixture doctor — exactly the pair needed to prove the
    // listing is scoped rather than just non-empty.
    const doctorCookie = await signInAsDoctor(app);
    const profile = await readJson<{ doctor: { id: string } }>(
      await app.request("/api/staff/me", { headers: { Cookie: doctorCookie } }),
    );

    const cookie = await signInAsPatient(app, "doctor-schedule@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    await bookAppointment(cookie, { doctorId: profile.doctor.id });
    await bookAppointment(cookie, { preferredSchedule: "2026-11-05T02:00:00Z" });

    const res = await app.request("/api/appointments", { headers: { Cookie: doctorCookie } });
    const { appointments } = await readJson<AppointmentsListResponse>(res);
    expect(appointments).toHaveLength(1);
  });

  it("gives a nurse the whole clinic's schedule", async () => {
    const cookieA = await signInAsPatient(app, "nurse-view-a@example.com");
    await registerTestPatient(app, { cookie: cookieA, doctorId });
    await bookAppointment(cookieA);

    const cookieB = await signInAsPatient(app, "nurse-view-b@example.com");
    await registerTestPatient(app, { cookie: cookieB, doctorId });
    await bookAppointment(cookieB, { preferredSchedule: "2026-11-04T02:00:00Z" });

    const nurseCookie = await signInAsNurse(app);
    const res = await app.request("/api/appointments", { headers: { Cookie: nurseCookie } });
    const { appointments } = await readJson<AppointmentsListResponse>(res);
    expect(appointments).toHaveLength(2);
  });
});

describe("account deletion cancels active appointments", () => {
  it("cancels a pending appointment when the owning patient deletes their account", async () => {
    const cookie = await signInAsPatient(app, "delete-cascade@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);
    expect(appointment.status).toBe("pending");

    await app.request("/api/patients/me", { method: "DELETE", headers: { Cookie: cookie } });

    const adminCookie = await signInAsAdmin(app);
    const res = await app.request("/api/appointments?status=cancelled", {
      headers: { Cookie: adminCookie },
    });
    const { appointments } = await readJson<{ appointments: { id: string; status: string }[] }>(
      res,
    );
    expect(appointments.some((a) => a.id === appointment.id)).toBe(true);
  });
});
