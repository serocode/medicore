import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsDoctor, signInAsNurse, signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/staff/me", () => {
  it("auto-provisions a minimal doctor profile on first sign-in", async () => {
    const cookie = await signInAsDoctor(app);
    const res = await app.request("/api/staff/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await readJson<{ role: string; doctor: { specialization: string } }>(res);
    expect(body.role).toBe("doctor");
    expect(body.doctor.specialization).toBe("General Practice");
  });

  it("auto-provisions a minimal nurse profile on first sign-in", async () => {
    const cookie = await signInAsNurse(app);
    const res = await app.request("/api/staff/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await readJson<{ role: string; nurse: { name: string } }>(res);
    expect(body.role).toBe("nurse");
  });

  it("404s for a patient (no staff profile)", async () => {
    const cookie = await signInAsPatient(app, "staff-check-patient@example.com");
    const res = await app.request("/api/staff/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/staff/me", () => {
  it("updates and persists a doctor's professional profile", async () => {
    const cookie = await signInAsDoctor(app);

    const res = await app.request("/api/staff/me", {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dr. Jane Rivera",
        specialization: "Cardiology",
        department: "Cardiology Dept",
      }),
    });
    expect(res.status).toBe(200);
    const body = await readJson<{ doctor: { specialization: string; department: string } }>(res);
    expect(body.doctor.specialization).toBe("Cardiology");
    expect(body.doctor.department).toBe("Cardiology Dept");

    const meRes = await app.request("/api/staff/me", { headers: { Cookie: cookie } });
    const me = await readJson<{ doctor: { specialization: string } }>(meRes);
    expect(me.doctor.specialization).toBe("Cardiology");
  });
});
