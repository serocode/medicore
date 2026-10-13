import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient, updateTestPatient } from "../test-utils/register-patient.js";

interface PatientResponse {
  patient: {
    id: string;
    consentTreatment: boolean;
    identificationDocumentPath: string | null;
    occupation: string;
  };
}

let doctorId: string;

beforeEach(async () => {
  await truncateAll(db);
  // truncateAll wipes `doctor` too (it now has a live FK to `user`), so the
  // fixture doctor must be re-seeded — and re-captured — every time.
  doctorId = (await ensureTestDoctor(db)).id;
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
  it("returns a null patient before the patient has registered", async () => {
    const cookie = await signInAsPatient(app, "me-test@example.com");
    const res = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    expect(await readJson<{ patient: null }>(res)).toEqual({ patient: null });
  });

  it("returns the patient profile after registering", async () => {
    const cookie = await signInAsPatient(app, "me-test-2@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const res = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/patients/me", () => {
  it("404s before the patient has registered", async () => {
    const cookie = await signInAsPatient(app, "patch-unregistered@example.com");
    const res = await updateTestPatient(app, { cookie, doctorId });
    expect(res.status).toBe(404);
  });

  it("updates a field and persists the change", async () => {
    const cookie = await signInAsPatient(app, "patch-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const res = await updateTestPatient(app, {
      cookie,
      doctorId,
      overrides: { occupation: "Retired" },
    });
    expect(res.status).toBe(200);
    expect((await readJson<PatientResponse>(res)).patient.occupation).toBe("Retired");

    const meRes = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect((await readJson<PatientResponse>(meRes)).patient.occupation).toBe("Retired");
  });

  it("keeps the existing ID document when no new file is uploaded", async () => {
    const cookie = await signInAsPatient(app, "patch-keep-doc@example.com");
    const registerRes = await registerTestPatient(app, { cookie, doctorId });
    const original = (await readJson<PatientResponse>(registerRes)).patient;

    const res = await updateTestPatient(app, { cookie, doctorId });
    const updated = (await readJson<PatientResponse>(res)).patient;
    expect(updated.identificationDocumentPath).toBe(original.identificationDocumentPath);
  });
});

describe("DELETE /api/patients/me", () => {
  it("404s before the patient has registered", async () => {
    const cookie = await signInAsPatient(app, "delete-unregistered@example.com");
    const res = await app.request("/api/patients/me", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });

  it("soft-deletes the profile: GET /me returns no patient afterward", async () => {
    const cookie = await signInAsPatient(app, "delete-test@example.com");
    await registerTestPatient(app, { cookie, doctorId });

    const deleteRes = await app.request("/api/patients/me", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);

    const meRes = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(meRes.status).toBe(200);
    expect(await readJson<{ patient: null }>(meRes)).toEqual({ patient: null });
  });

  it("lets the same user re-register afterward instead of hitting the duplicate 409", async () => {
    const cookie = await signInAsPatient(app, "reactivate-test@example.com");
    const firstRegister = await registerTestPatient(app, { cookie, doctorId });
    const firstId = (await readJson<PatientResponse>(firstRegister)).patient.id;

    await app.request("/api/patients/me", { method: "DELETE", headers: { Cookie: cookie } });

    const secondRegister = await registerTestPatient(app, {
      cookie,
      doctorId,
      overrides: { occupation: "Reactivated" },
    });
    expect(secondRegister.status).toBe(201);
    const reactivated = (await readJson<PatientResponse>(secondRegister)).patient;
    expect(reactivated.id).toBe(firstId);
    expect(reactivated.occupation).toBe("Reactivated");

    const meRes = await app.request("/api/patients/me", { headers: { Cookie: cookie } });
    expect(meRes.status).toBe(200);
  });
});
