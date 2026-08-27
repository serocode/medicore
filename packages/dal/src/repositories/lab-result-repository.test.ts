import { LabResultConcurrentUpdateError } from "@healthcare/application";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import {
  TEST_DATABASE_URL,
  ensureTestDatabase,
  ensureTestDoctor,
  ensureTestLabTestCatalogItem,
  truncateAll,
} from "../test-utils/test-db.js";
import { DrizzleLabResultRepository } from "./lab-result-repository.js";
import { DrizzlePatientRepository } from "./patient-repository.js";

let db: Db;
let repo: DrizzleLabResultRepository;
let patientRepo: DrizzlePatientRepository;
let doctorId: string;
let catalogItemId: string;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleLabResultRepository(db);
  patientRepo = new DrizzlePatientRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
  doctorId = (await ensureTestDoctor(db)).id;
  catalogItemId = (await ensureTestLabTestCatalogItem(db)).id;
});

async function createTestPatient() {
  const testUser = await insertTestUser(db);
  return patientRepo.create({
    userId: testUser.id,
    birthDate: "1990-01-01",
    gender: "other",
    address: "1 Test St",
    occupation: "Tester",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "555-0000",
    primaryPhysicianId: doctorId,
    insuranceProvider: null,
    insurancePolicyNumber: null,
    allergies: null,
    currentMedications: null,
    familyMedicalHistory: null,
    pastMedicalHistory: null,
    identificationType: "Passport",
    identificationNumber: "X1234567",
    identificationDocumentPath: "id.pdf",
    bloodType: null,
    consentTreatment: true,
    consentDisclosure: true,
    consentPrivacy: true,
    deletedAt: null,
  });
}

const requestBase = {
  encounterId: null,
  requestNotes: null,
  datePerformed: null,
  dateReleased: null,
  facility: null,
  findings: null,
  summary: null,
  interpretation: null,
  remarks: null,
  uploadedByUserId: null,
  uploadedByName: null,
  uploadedByRole: null,
  uploadedAt: null,
  reviewedByUserId: null,
  reviewedByName: null,
  reviewInterpretation: null,
  reviewNotes: null,
  followUpRecommendation: null,
  actionTaken: null,
  cancellationReason: null,
} as const;

describe("DrizzleLabResultRepository", () => {
  it("creates a lab result request and lists it for the patient", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);

    const created = await repo.create({
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology",
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor",
    });

    expect(created.status).toBe("requested");

    const list = await repo.listByPatientId(patient.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(created.id);
  });

  it("filters listAll by status", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);
    const base = {
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology" as const,
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor" as const,
    };

    const requested = await repo.create(base);
    const toReview = await repo.create(base);
    await repo.update({ ...toReview, status: "result_available" }, toReview.status);

    const pending = await repo.listAll(["requested"]);
    expect(pending.map((r) => r.id)).toEqual([requested.id]);

    const awaitingReview = await repo.listAll(["result_available"]);
    expect(awaitingReview.map((r) => r.id)).toEqual([toReview.id]);

    const all = await repo.listAll();
    expect(all).toHaveLength(2);
  });

  it("joins the requesting patient's name in listAllWithPatientName", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);
    await repo.create({
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology",
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor",
    });

    const results = await repo.listAllWithPatientName(["requested"]);
    expect(results).toHaveLength(1);
    expect(results[0]?.patientName).toBeTruthy();
  });

  it("fully replaces parameters rather than appending", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);
    const created = await repo.create({
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology",
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor",
    });

    await repo.replaceParameters(created.id, [
      {
        parameterName: "Hemoglobin",
        value: "14.2",
        unit: "g/dL",
        referenceRange: "13-17",
        flag: "normal",
        remarks: null,
        sortOrder: 0,
      },
      {
        parameterName: "WBC",
        value: "7.8",
        unit: "10^9/L",
        referenceRange: "4-11",
        flag: "normal",
        remarks: null,
        sortOrder: 1,
      },
    ]);

    let params = await repo.listParametersByLabResultId(created.id);
    expect(params).toHaveLength(2);

    params = await repo.replaceParameters(created.id, [
      {
        parameterName: "Hemoglobin",
        value: "10.0",
        unit: "g/dL",
        referenceRange: "13-17",
        flag: "abnormal",
        remarks: "Low",
        sortOrder: 0,
      },
    ]);
    expect(params).toHaveLength(1);
    expect(params[0]?.value).toBe("10.0");
    expect(params[0]?.flag).toBe("abnormal");

    const listed = await repo.listParametersByLabResultId(created.id);
    expect(listed).toHaveLength(1);
  });

  it("rejects an update whose expected status no longer matches the row", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);
    const created = await repo.create({
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology",
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor",
    });

    await expect(
      repo.update({ ...created, status: "cancelled" }, "result_available"),
    ).rejects.toThrow(LabResultConcurrentUpdateError);
  });

  it("finds the owning patientId by report file path", async () => {
    const patient = await createTestPatient();
    const staffUser = await insertTestUser(db);
    const created = await repo.create({
      ...requestBase,
      patientId: patient.id,
      catalogItemId,
      testName: "CBC",
      category: "hematology",
      requestedByUserId: staffUser.id,
      requestedByName: "Dr. Test",
      requestedByRole: "doctor",
    });
    await repo.update({ ...created, reportFilePath: "some-key.pdf" }, created.status);

    const foundPatientId = await repo.findPatientIdByReportFilePath("some-key.pdf");
    expect(foundPatientId).toBe(patient.id);

    const notFound = await repo.findPatientIdByReportFilePath("missing-key.pdf");
    expect(notFound).toBeNull();
  });
});
