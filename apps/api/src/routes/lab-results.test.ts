import {
  ensureTestDoctor,
  ensureTestLabTestCatalogItem,
  truncateAll,
} from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsDoctor, signInAsNurse, signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient } from "../test-utils/register-patient.js";

interface LabResultResponse {
  labResult: { id: string; status: string; testName: string };
}

let doctorId: string;
let catalogItemId: string;

beforeEach(async () => {
  await truncateAll(db);
  doctorId = (await ensureTestDoctor(db)).id;
  catalogItemId = (await ensureTestLabTestCatalogItem(db)).id;
});

async function registerAndGetPatientId(
  email: string,
): Promise<{ cookie: string; patientId: string }> {
  const cookie = await signInAsPatient(app, email);
  const res = await registerTestPatient(app, { cookie, doctorId });
  const body = await readJson<{ patient: { id: string } }>(res);
  return { cookie, patientId: body.patient.id };
}

async function requestLabTest(patientId: string, cookie: string): Promise<LabResultResponse> {
  const res = await app.request(`/api/patients/${patientId}/lab-results`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ catalogItemId, requestNotes: "Routine check" }),
  });
  expect(res.status).toBe(201);
  return readJson<LabResultResponse>(res);
}

function uploadFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.append("findings", "No abnormal findings");
  formData.append(
    "parameters",
    JSON.stringify([
      {
        parameterName: "Hemoglobin",
        value: "14.2",
        unit: "g/dL",
        referenceRange: "13-17",
        flag: "normal",
      },
    ]),
  );
  for (const [key, value] of Object.entries(overrides)) {
    formData.append(key, value);
  }
  formData.append(
    "reportFile",
    new File(["report content"], "cbc.pdf", { type: "application/pdf" }),
  );
  return formData;
}

describe("POST /api/patients/:patientId/lab-results", () => {
  it("lets a doctor request a lab test", async () => {
    const { patientId } = await registerAndGetPatientId("lab-doctor-request@example.com");
    const doctorCookie = await signInAsDoctor(app);

    const { labResult } = await requestLabTest(patientId, doctorCookie);
    expect(labResult.status).toBe("requested");
    expect(labResult.testName).toBeTruthy();
  });

  it("lets a nurse request a lab test", async () => {
    const { patientId } = await registerAndGetPatientId("lab-nurse-request@example.com");
    const nurseCookie = await signInAsNurse(app);

    const { labResult } = await requestLabTest(patientId, nurseCookie);
    expect(labResult.status).toBe("requested");
  });

  it("rejects a patient requesting a lab test", async () => {
    const { patientId, cookie } = await registerAndGetPatientId("lab-patient-request@example.com");

    const res = await app.request(`/api/patients/${patientId}/lab-results`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId }),
    });
    expect(res.status).toBe(403);
  });

  it("404s for an unknown catalog item", async () => {
    const { patientId } = await registerAndGetPatientId("lab-unknown-catalog@example.com");
    const doctorCookie = await signInAsDoctor(app);

    const res = await app.request(`/api/patients/${patientId}/lab-results`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("lab result upload/review/cancel workflow", () => {
  it("uploads a result, transitions to result_available, then a doctor reviews it", async () => {
    const { patientId } = await registerAndGetPatientId("lab-workflow@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    const nurseCookie = await signInAsNurse(app);
    const uploadRes = await app.request(
      `/api/patients/${patientId}/lab-results/${labResult.id}/result`,
      { method: "POST", headers: { Cookie: nurseCookie }, body: uploadFormData() },
    );
    expect(uploadRes.status).toBe(200);
    const uploaded = await readJson<{
      labResult: { status: string };
      parameters: { parameterName: string; value: string }[];
    }>(uploadRes);
    expect(uploaded.labResult.status).toBe("result_available");
    expect(uploaded.parameters).toHaveLength(1);
    expect(uploaded.parameters[0]?.value).toBe("14.2");

    const nurseReviewRes = await app.request(
      `/api/patients/${patientId}/lab-results/${labResult.id}/review`,
      {
        method: "PATCH",
        headers: { Cookie: nurseCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewInterpretation: "Not allowed",
          reviewNotes: "Not allowed",
        }),
      },
    );
    expect(nurseReviewRes.status).toBe(403);

    const doctorReviewRes = await app.request(
      `/api/patients/${patientId}/lab-results/${labResult.id}/review`,
      {
        method: "PATCH",
        headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewInterpretation: "No significant abnormality",
          followUpRecommendation: "None",
        }),
      },
    );
    expect(doctorReviewRes.status).toBe(200);
    const reviewed = await readJson<{ labResult: { status: string; reviewedByName: string } }>(
      doctorReviewRes,
    );
    expect(reviewed.labResult.status).toBe("reviewed");
    expect(reviewed.labResult.reviewedByName).toBeTruthy();
  });

  it("rejects reviewing a request with no uploaded result yet", async () => {
    const { patientId } = await registerAndGetPatientId("lab-review-too-early@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    const res = await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/review`, {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reviewInterpretation: "Looks fine" }),
    });
    expect(res.status).toBe(409);
  });

  it("rejects reviewing with no clinical interpretation", async () => {
    const { patientId } = await registerAndGetPatientId("lab-review-no-interpretation@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/result`, {
      method: "POST",
      headers: { Cookie: doctorCookie },
      body: uploadFormData(),
    });

    const res = await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/review`, {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("cancels a requested test with a reason", async () => {
    const { patientId } = await registerAndGetPatientId("lab-cancel@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    const res = await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Ordered in error" }),
    });
    expect(res.status).toBe(200);
    const body = await readJson<{ labResult: { status: string } }>(res);
    expect(body.labResult.status).toBe("cancelled");
  });

  it("rejects cancelling once a result has been uploaded", async () => {
    const { patientId } = await registerAndGetPatientId("lab-cancel-too-late@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/result`, {
      method: "POST",
      headers: { Cookie: doctorCookie },
      body: uploadFormData(),
    });

    const res = await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}/cancel`, {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Too late" }),
    });
    expect(res.status).toBe(409);
  });

  it("rejects a patient accessing any lab-result route", async () => {
    const { patientId, cookie } = await registerAndGetPatientId("lab-patient-blocked@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientId, doctorCookie);

    const res = await app.request(`/api/patients/${patientId}/lab-results/${labResult.id}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/patients/:patientId/lab-results", () => {
  it("rejects an encounterId that belongs to a different patient", async () => {
    const { patientId: patientAId } = await registerAndGetPatientId("lab-encounter-a@example.com");
    const { patientId: patientBId } = await registerAndGetPatientId("lab-encounter-b@example.com");
    const doctorCookie = await signInAsDoctor(app);

    const encounterRes = await app.request(`/api/patients/${patientAId}/encounters`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ encounterType: "consultation" }),
    });
    const { encounter } = await readJson<{ encounter: { id: string } }>(encounterRes);

    const res = await app.request(`/api/patients/${patientBId}/lab-results`, {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId, encounterId: encounter.id }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/patients/:patientId/lab-results/:labResultId", () => {
  it("404s when the result belongs to a different patient", async () => {
    const { patientId: patientAId } = await registerAndGetPatientId(
      "lab-cross-patient-a@example.com",
    );
    const { patientId: patientBId } = await registerAndGetPatientId(
      "lab-cross-patient-b@example.com",
    );
    const doctorCookie = await signInAsDoctor(app);
    const { labResult } = await requestLabTest(patientAId, doctorCookie);

    const res = await app.request(`/api/patients/${patientBId}/lab-results/${labResult.id}`, {
      headers: { Cookie: doctorCookie },
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/lab-results (cross-patient dashboard)", () => {
  it("filters by multiple status query params", async () => {
    const { patientId } = await registerAndGetPatientId("lab-dashboard@example.com");
    const doctorCookie = await signInAsDoctor(app);
    const { labResult: requested } = await requestLabTest(patientId, doctorCookie);
    const { labResult: toReview } = await requestLabTest(patientId, doctorCookie);
    await app.request(`/api/patients/${patientId}/lab-results/${toReview.id}/result`, {
      method: "POST",
      headers: { Cookie: doctorCookie },
      body: uploadFormData(),
    });

    const pendingRes = await app.request("/api/lab-results?status=requested&status=pending", {
      headers: { Cookie: doctorCookie },
    });
    expect(pendingRes.status).toBe(200);
    const pending = await readJson<{ labResults: { id: string }[] }>(pendingRes);
    expect(pending.labResults.map((r) => r.id)).toEqual([requested.id]);

    const awaitingReviewRes = await app.request("/api/lab-results?status=result_available", {
      headers: { Cookie: doctorCookie },
    });
    const awaitingReview = await readJson<{ labResults: { id: string }[] }>(awaitingReviewRes);
    expect(awaitingReview.labResults.map((r) => r.id)).toEqual([toReview.id]);
  });
});
