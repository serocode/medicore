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
import { DrizzleVitalSignRepository } from "./vital-sign-repository.js";

let db: Db;
let repo: DrizzleVitalSignRepository;
let encounterRepo: DrizzleEncounterRepository;
let patientRepo: DrizzlePatientRepository;
let doctorId: string;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleVitalSignRepository(db);
  encounterRepo = new DrizzleEncounterRepository(db);
  patientRepo = new DrizzlePatientRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
  doctorId = (await ensureTestDoctor(db)).id;
});

async function createTestPatientAndEncounter() {
  const testUser = await insertTestUser(db);
  const patient = await patientRepo.create({
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

  const staffUser = await insertTestUser(db);
  const encounter = await encounterRepo.create({
    patientId: patient.id,
    recordedByUserId: staffUser.id,
    recordedByName: "Nurse Test",
    recordedByRole: "nurse",
    encounterType: "vitals_only",
    chiefComplaint: null,
    subjective: null,
    objectiveFindings: null,
    assessment: null,
    diagnosis: null,
    plan: null,
    recommendations: null,
    followUpInstructions: null,
    additionalNotes: null,
  });

  return { patient, encounter, staffUser };
}

describe("DrizzleVitalSignRepository", () => {
  it("creates a vital sign row and lists it for the patient", async () => {
    const { patient, encounter, staffUser } = await createTestPatientAndEncounter();

    const created = await repo.create({
      encounterId: encounter.id,
      patientId: patient.id,
      recordedByUserId: staffUser.id,
      recordedByName: "Nurse Test",
      bpSystolic: 120,
      bpDiastolic: 80,
      heartRate: 72,
      respiratoryRate: 16,
      temperatureCelsius: 36.7,
      oxygenSaturation: 98,
      weightKg: 70,
      heightCm: 175,
      bmi: 22.9,
      notes: null,
    });

    expect(created.heartRate).toBe(72);
    expect(created.bmi).toBe(22.9);

    const list = await repo.listByPatientId(patient.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(created.id);
  });
});
