import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsDoctor, signInAsNurse, signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient } from "../test-utils/register-patient.js";

interface EncounterResponse {
  encounter: { id: string; recordedByRole: string; diagnosis: string | null };
  vitalSign: { id: string; bmi: number | null; heartRate: number | null } | null;
}

let doctorId: string;

beforeEach(async () => {
  await truncateAll(db);
  doctorId = (await ensureTestDoctor(db)).id;
});

async function registerAndGetPatientId(
  email: string,
): Promise<{ cookie: string; patientId: string }> {
  const cookie = await signInAsPatient(app, email);
  const res = await registerTestPatient(app, { cookie, doctorId });
  const body = await readJson<{ patient: { id: string } }>(res);
  return { cookie, patientId: body.patient.id };
}

describe("POST /api/patients/:patientId/encounters", () => {
  it("lets a doctor record a consultation with vitals and a diagnosis", async () => {
    const { patientId } = await registerAndGetPatientId("encounter-doctor-patient@example.com");
    const doctorCookie = await signInAsDoctor(app);

    const res = await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        encounterType: "consultation",
        chiefComplaint: "Headache",
        assessment: "Tension headache",
        diagnosis: "Tension-type headache",
        plan: "Rest and hydration",
        vitals: { heartRate: 76, weightKg: 70, heightCm: 175 },
      }),
    });

    expect(res.status).toBe(201);
    const body = await readJson<EncounterResponse>(res);
    expect(body.encounter.recordedByRole).toBe("doctor");
    expect(body.encounter.diagnosis).toBe("Tension-type headache");
    expect(body.vitalSign?.heartRate).toBe(76);
    expect(body.vitalSign?.bmi).toBe(22.9);
  });

  it("lets a nurse record vitals without a diagnosis", async () => {
    const { patientId } = await registerAndGetPatientId("encounter-nurse-patient@example.com");
    const nurseCookie = await signInAsNurse(app);

    const res = await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: nurseCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        encounterType: "vitals_only",
        vitals: { bpSystolic: 120, bpDiastolic: 80, heartRate: 72 },
      }),
    });

    expect(res.status).toBe(201);
    const body = await readJson<EncounterResponse>(res);
    expect(body.encounter.recordedByRole).toBe("nurse");
    expect(body.vitalSign?.heartRate).toBe(72);
  });

  it("rejects a nurse-submitted diagnosis", async () => {
    const { patientId } = await registerAndGetPatientId("encounter-nurse-diagnosis@example.com");
    const nurseCookie = await signInAsNurse(app);

    const res = await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: nurseCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        encounterType: "nursing_check",
        diagnosis: "Not allowed",
      }),
    });

    expect(res.status).toBe(403);
  });

  it("rejects a patient trying to record an encounter (staff-only)", async () => {
    const { patientId, cookie } = await registerAndGetPatientId(
      "encounter-patient-self@example.com",
    );

    const res = await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ encounterType: "other" }),
    });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/patients/:patientId/encounters and /vitals", () => {
  it("returns the patient's timeline in reverse-chronological order", async () => {
    const { patientId } = await registerAndGetPatientId("timeline-patient@example.com");
    const doctorCookie = await signInAsDoctor(app);

    await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ encounterType: "consultation", chiefComplaint: "First visit" }),
    });
    await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ encounterType: "follow_up", chiefComplaint: "Follow-up visit" }),
    });

    const res = await app.request(`/api/patients/${patientId}/encounters`, {
      headers: { Cookie: doctorCookie },
    });
    expect(res.status).toBe(200);
    const { encounters } = await readJson<{ encounters: { chiefComplaint: string }[] }>(res);
    expect(encounters).toHaveLength(2);
    expect(encounters[0]?.chiefComplaint).toBe("Follow-up visit");
  });

  it("lists recorded vitals for the patient", async () => {
    const { patientId } = await registerAndGetPatientId("vitals-list-patient@example.com");
    const nurseCookie = await signInAsNurse(app);

    await app.request(`/api/patients/${patientId}/encounters`, {
      method: "POST",
      headers: { Cookie: nurseCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ encounterType: "vitals_only", vitals: { heartRate: 80 } }),
    });

    const res = await app.request(`/api/patients/${patientId}/vitals`, {
      headers: { Cookie: nurseCookie },
    });
    expect(res.status).toBe(200);
    const { vitals } = await readJson<{ vitals: { heartRate: number }[] }>(res);
    expect(vitals).toHaveLength(1);
    expect(vitals[0]?.heartRate).toBe(80);
  });
});
