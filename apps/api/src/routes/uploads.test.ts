import {
  ensureTestDoctor,
  ensureTestLabTestCatalogItem,
  truncateAll,
} from "@healthcare/dal/src/test-utils/test-db.js";
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

interface PatientResponse {
  patient: { id: string; identificationDocumentPath: string | null };
}

let doctorId: string;
let catalogItemId: string;

beforeEach(async () => {
  await truncateAll(db);
  // truncateAll wipes `doctor` too (it now has a live FK to `user`), so the
  // fixture doctor must be re-seeded — and re-captured — every time.
  doctorId = (await ensureTestDoctor(db)).id;
  catalogItemId = (await ensureTestLabTestCatalogItem(db)).id;
});

describe("GET /api/uploads/:key", () => {
  it("lets the owning patient read their own document", async () => {
    const cookie = await signInAsPatient(app, "owner@example.com");
    const registerRes = await registerTestPatient(app, { cookie, doctorId });
    const { patient } = await readJson<PatientResponse>(registerRes);

    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
  });

  it("denies a different patient", async () => {
    const ownerCookie = await signInAsPatient(app, "owner2@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const otherCookie = await signInAsPatient(app, "other@example.com");
    await registerTestPatient(app, { cookie: otherCookie, doctorId });

    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: otherCookie },
    });
    expect(res.status).toBe(403);
  });

  it("lets an admin read any patient's document", async () => {
    const ownerCookie = await signInAsPatient(app, "owner3@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const adminCookie = await signInAsAdmin(app);
    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
  });

  it("serves files with a cross-origin resource policy so <img> can render them", async () => {
    // The web app runs on a different origin and renders these as <img>, which
    // the browser blocks outright when CORP is `same-origin` — CORS does not
    // apply to a no-cors image load. Every other route keeps the strict default.
    const cookie = await signInAsPatient(app, "corp-owner@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie, doctorId }),
    );

    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: cookie },
    });
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");

    const elsewhere = await app.request("/api/account/me", { headers: { Cookie: cookie } });
    expect(elsewhere.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("rejects a path-traversal-shaped key", async () => {
    const adminCookie = await signInAsAdmin(app);
    const res = await app.request("/api/uploads/..%2f..%2fetc%2fpasswd", {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/uploads/:key for lab-result report files", () => {
  async function uploadLabResultFile(patientId: string, cookie: string): Promise<string> {
    const requestRes = await app.request(`/api/patients/${patientId}/lab-results`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId }),
    });
    const { labResult } = await readJson<{ labResult: { id: string } }>(requestRes);

    const formData = new FormData();
    formData.append("parameters", "[]");
    formData.append(
      "reportFile",
      new File(["report content"], "cbc.pdf", { type: "application/pdf" }),
    );
    const uploadRes = await app.request(
      `/api/patients/${patientId}/lab-results/${labResult.id}/result`,
      { method: "POST", headers: { Cookie: cookie }, body: formData },
    );
    const uploaded = await readJson<{ labResult: { reportFilePath: string } }>(uploadRes);
    return uploaded.labResult.reportFilePath;
  }

  it("lets any doctor or nurse read a patient's lab-result file, unscoped", async () => {
    const ownerCookie = await signInAsPatient(app, "lab-file-owner@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const doctorCookie = await signInAsDoctor(app);
    const key = await uploadLabResultFile(patient.id, doctorCookie);

    const nurseCookie = await signInAsNurse(app);
    const res = await app.request(`/api/uploads/${key}`, { headers: { Cookie: nurseCookie } });
    expect(res.status).toBe(200);
  });

  it("lets the owning patient read their own lab-result file", async () => {
    const ownerCookie = await signInAsPatient(app, "lab-file-self@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const doctorCookie = await signInAsDoctor(app);
    const key = await uploadLabResultFile(patient.id, doctorCookie);

    const res = await app.request(`/api/uploads/${key}`, { headers: { Cookie: ownerCookie } });
    expect(res.status).toBe(200);
  });

  it("denies a different patient reading someone else's lab-result file", async () => {
    const ownerCookie = await signInAsPatient(app, "lab-file-other-owner@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const doctorCookie = await signInAsDoctor(app);
    const key = await uploadLabResultFile(patient.id, doctorCookie);

    const otherCookie = await signInAsPatient(app, "lab-file-other@example.com");
    await registerTestPatient(app, { cookie: otherCookie, doctorId });

    const res = await app.request(`/api/uploads/${key}`, { headers: { Cookie: otherCookie } });
    expect(res.status).toBe(403);
  });
});
