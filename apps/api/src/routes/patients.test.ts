import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient } from "../test-utils/register-patient.js";

interface PatientResponse {
  patient: { consentTreatment: boolean; identificationDocumentPath: string | null };
}

let doctorId: string;

beforeAll(async () => {
  doctorId = (await ensureTestDoctor(db)).id;
});

beforeEach(async () => {
  await truncateAll(db);
});

describe("POST /api/patients/register", () => {
  it("registers a patient with an uploaded ID document", async () => {
    const cookie = await signInAsPatient(app, "register-test@example.com");
    const res = await registerTestPatient(app, { cookie, doctorId });

    expect(res.status).toBe(201);
    const body = await readJson<PatientResponse>(res);
    expect(body.patient.consentTreatment).toBe(true);
    expect(body.patient.identificationDocumentPath).toMatch(/\.pdf$/);
  });

  it("rejects a second registration for the same user", async () => {
    const cookie = await signInAsPatient(app, "dup-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const res = await registerTestPatient(app, { cookie, doctorId });
    expect(res.status).toBe(409);
  });

  it("rejects registration when consent is missing", async () => {
    const cookie = await signInAsPatient(app, "consent-test@example.com");
    const res = await registerTestPatient(app, {
      cookie,
      doctorId,
      overrides: { consentDisclosure: "false" },
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/patients/me", () => {
  it("404s before the patient has registered", async () => {
    const cookie = await signInAsPatient(app, "me-test@example.com");
    const res = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(404);
  });

  it("returns the patient profile after registering", async () => {
    const cookie = await signInAsPatient(app, "me-test-2@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const res = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
  });
});
