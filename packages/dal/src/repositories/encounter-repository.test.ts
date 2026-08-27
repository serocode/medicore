import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import {
  TEST_DATABASE_URL,
  ensureTestDatabase,
  ensureTestDoctor,
  truncateAll,
} from "../test-utils/test-db.js";
import { DrizzleEncounterRepository } from "./encounter-repository.js";
import { DrizzlePatientRepository } from "./patient-repository.js";

let db: Db;
let repo: DrizzleEncounterRepository;
let patientRepo: DrizzlePatientRepository;
let doctorId: string;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleEncounterRepository(db);
  patientRepo = new DrizzlePatientRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
  doctorId = (await ensureTestDoctor(db)).id;
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

const encounterBase = {
  subjective: null,
  objectiveFindings: null,
  assessment: null,
  diagnosis: null,
  plan: null,
  recommendations: null,
  followUpInstructions: null,
  additionalNotes: null,
} as const;

describe("DrizzleEncounterRepository", () => {
  it("creates an encounter and lists it for the patient", async () => {
    const p = await createTestPatient();
    const staffUser = await insertTestUser(db);

    const created = await repo.create({
      ...encounterBase,
      patientId: p.id,
      recordedByUserId: staffUser.id,
      recordedByName: "Dr. Test",
      recordedByRole: "doctor",
      encounterType: "consultation",
      chiefComplaint: "Cough",
    });

    expect(created.chiefComplaint).toBe("Cough");
    const list = await repo.listByPatientId(p.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(created.id);
  });

  it("orders listByPatientId reverse-chronologically", async () => {
    const p = await createTestPatient();
    const staffUser = await insertTestUser(db);
    const base = {
      ...encounterBase,
      patientId: p.id,
      recordedByUserId: staffUser.id,
      recordedByName: "Dr. Test",
      recordedByRole: "doctor" as const,
    };

    const first = await repo.create({
      ...base,
      encounterType: "consultation",
      chiefComplaint: "First",
      occurredAt: new Date("2026-01-01T09:00:00Z"),
    });
    const second = await repo.create({
      ...base,
      encounterType: "follow_up",
      chiefComplaint: "Second",
      occurredAt: new Date("2026-01-05T09:00:00Z"),
    });

    const list = await repo.listByPatientId(p.id);
    expect(list.map((e) => e.id)).toEqual([second.id, first.id]);
  });
});
