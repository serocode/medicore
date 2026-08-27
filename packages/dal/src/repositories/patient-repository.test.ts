import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { user } from "../schema/auth.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import {
  TEST_DATABASE_URL,
  ensureTestDatabase,
  ensureTestDoctor,
  truncateAll,
} from "../test-utils/test-db.js";
import { DrizzlePatientRepository } from "./patient-repository.js";

let db: Db;
let repo: DrizzlePatientRepository;
let doctorId: string;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzlePatientRepository(db);
  doctorId = (await ensureTestDoctor(db)).id;
});

beforeEach(async () => {
  await truncateAll(db);
});

function samplePatient(userId: string) {
  return {
    userId,
    birthDate: "1990-01-01",
    gender: "other" as const,
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
    identificationDocumentPath: "some-file.pdf",
    consentTreatment: true,
    consentDisclosure: true,
    consentPrivacy: true,
  };
}

describe("DrizzlePatientRepository", () => {
  it("creates a patient and finds it by id and by userId", async () => {
    const testUser = await insertTestUser(db);
    const created = await repo.create(samplePatient(testUser.id));

    expect(await repo.findById(created.id)).toEqual(created);
    expect(await repo.findByUserId(testUser.id)).toEqual(created);
  });

  it("returns null when no patient exists for a user", async () => {
    const testUser = await insertTestUser(db);
    expect(await repo.findByUserId(testUser.id)).toBeNull();
  });

  it("rejects a second patient profile for the same user (unique userId)", async () => {
    const testUser = await insertTestUser(db);
    await repo.create(samplePatient(testUser.id));

    await expect(repo.create(samplePatient(testUser.id))).rejects.toThrow();
  });

  it("rejects a patient referencing a non-existent physician", async () => {
    const testUser = await insertTestUser(db);
    await expect(
      repo.create({
        ...samplePatient(testUser.id),
        primaryPhysicianId: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toThrow();
  });

  it("returns the owning user's email via getContactEmail", async () => {
    const testUser = await insertTestUser(db, { email: "contact-test@example.com" });
    const created = await repo.create(samplePatient(testUser.id));

    expect(await repo.getContactEmail(created.id)).toBe("contact-test@example.com");
  });

  it("cascades: deleting the user deletes their patient profile", async () => {
    const testUser = await insertTestUser(db);
    const created = await repo.create(samplePatient(testUser.id));

    await db.delete(user).where(eq(user.id, testUser.id));

    expect(await repo.findById(created.id)).toBeNull();
  });
});
