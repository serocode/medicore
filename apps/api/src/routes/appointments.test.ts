import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsAdmin, signInAsPatient } from "../test-utils/api-test-client.js";
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

beforeAll(async () => {
  doctorId = (await ensureTestDoctor(db)).id;
});

beforeEach(async () => {
  await truncateAll(db);
});

async function bookAppointment(cookie: string, overrides: Record<string, unknown> = {}) {
  return app.request("/api/appointments", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      doctorId,
      reason: "Checkup",
      preferredSchedule: "2026-11-01T10:00:00Z",
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

describe("appointment confirm/cancel authorization and business rules", () => {
  it("rejects a patient trying to confirm (admin-only)", async () => {
    const cookie = await signInAsPatient(app, "patient-confirm@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);

    const res = await app.request(`/api/appointments/${appointment.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-01T14:00:00Z" }),
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
      body: JSON.stringify({ scheduledAt: "2026-11-01T14:00:00Z" }),
    });
    expect(confirmA.status).toBe(200);

    const cookieB = await signInAsPatient(app, "double-b@example.com");
    await registerTestPatient(app, { cookie: cookieB, doctorId });
    const appointmentB = await bookedAppointment(cookieB, {
      preferredSchedule: "2026-11-02T09:00:00Z",
    });

    const conflictRes = await app.request(`/api/appointments/${appointmentB.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-01T14:00:00Z" }),
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

  it("reflects confirmed/cancelled counts in /stats (admin-only)", async () => {
    const cookie = await signInAsPatient(app, "stats-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });
    const appointment = await bookedAppointment(cookie);
    const adminCookie = await signInAsAdmin(app);

    await app.request(`/api/appointments/${appointment.id}/confirm`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: "2026-11-01T14:00:00Z" }),
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
});
