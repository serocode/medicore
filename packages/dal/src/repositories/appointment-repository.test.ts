import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { patient } from "../schema/patient.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import {
  TEST_DATABASE_URL,
  ensureTestDatabase,
  ensureTestDoctor,
  truncateAll,
} from "../test-utils/test-db.js";
import { DrizzleAppointmentRepository } from "./appointment-repository.js";
import { DrizzlePatientRepository } from "./patient-repository.js";

let db: Db;
let repo: DrizzleAppointmentRepository;
let patientRepo: DrizzlePatientRepository;
let doctorId: string;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleAppointmentRepository(db);
  patientRepo = new DrizzlePatientRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
  // truncateAll wipes `doctor` too (it now has a live FK to `user`), so the
  // fixture doctor must be re-seeded — and re-captured — every time, not
  // just once in beforeAll.
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

describe("DrizzleAppointmentRepository", () => {
  it("creates and finds an appointment by id", async () => {
    const p = await createTestPatient();
    const created = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Checkup",
      preferredSchedule: new Date("2026-10-01T10:00:00Z"),
    });

    expect(created.status).toBe("pending");
    expect(await repo.findById(created.id)).toEqual(created);
  });

  it("rejects an appointment for a non-existent patient", async () => {
    await expect(
      repo.create({
        patientId: "00000000-0000-0000-0000-000000000000",
        doctorId,
        reason: "Checkup",
        preferredSchedule: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("update() persists status/schedule changes", async () => {
    const p = await createTestPatient();
    const created = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Checkup",
      preferredSchedule: new Date("2026-10-01T10:00:00Z"),
    });

    const scheduledAt = new Date("2026-10-02T14:00:00Z");
    const updated = await repo.update({ ...created, status: "scheduled", scheduledAt });

    expect(updated.status).toBe("scheduled");
    expect(updated.scheduledAt).toEqual(scheduledAt);
    expect((await repo.findById(created.id))?.status).toBe("scheduled");
  });

  it("listByPatientId only returns that patient's appointments", async () => {
    const patientA = await createTestPatient();
    const patientB = await createTestPatient();
    await repo.create({
      patientId: patientA.id,
      doctorId,
      reason: "A's visit",
      preferredSchedule: new Date(),
    });
    await repo.create({
      patientId: patientB.id,
      doctorId,
      reason: "B's visit",
      preferredSchedule: new Date(),
    });

    const aOnly = await repo.listByPatientId(patientA.id);
    expect(aOnly).toHaveLength(1);
    expect(aOnly[0]?.reason).toBe("A's visit");
  });

  it("listAll(status) filters by status", async () => {
    const p = await createTestPatient();
    const pending = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Pending one",
      preferredSchedule: new Date(),
    });
    const toCancel = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Cancelled one",
      preferredSchedule: new Date(),
    });
    await repo.update({ ...toCancel, status: "cancelled", cancellationReason: "test" });

    const pendingOnly = await repo.listAll("pending");
    expect(pendingOnly.map((a) => a.id)).toEqual([pending.id]);
  });

  it("findScheduledForDoctorAt finds only matching scheduled appointments", async () => {
    const p = await createTestPatient();
    const scheduledAt = new Date("2026-10-05T09:00:00Z");
    const created = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Slot test",
      preferredSchedule: scheduledAt,
    });

    expect(await repo.findScheduledForDoctorAt(doctorId, scheduledAt)).toBeNull();

    await repo.update({ ...created, status: "scheduled", scheduledAt });
    const found = await repo.findScheduledForDoctorAt(doctorId, scheduledAt);
    expect(found?.id).toBe(created.id);
  });

  it("countByStatus tallies correctly", async () => {
    const p = await createTestPatient();
    const a = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "a",
      preferredSchedule: new Date(),
    });
    const b = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "b",
      preferredSchedule: new Date(),
    });
    await repo.create({ patientId: p.id, doctorId, reason: "c", preferredSchedule: new Date() });
    await repo.update({ ...a, status: "scheduled", scheduledAt: new Date() });
    await repo.update({ ...b, status: "cancelled", cancellationReason: "x" });

    expect(await repo.countByStatus()).toEqual({ pending: 1, scheduled: 1, cancelled: 1 });
  });

  it("cascades: deleting a patient deletes their appointments", async () => {
    const p = await createTestPatient();
    const created = await repo.create({
      patientId: p.id,
      doctorId,
      reason: "Checkup",
      preferredSchedule: new Date(),
    });

    await db.delete(patient).where(eq(patient.id, p.id));

    expect(await repo.findById(created.id)).toBeNull();
  });
});
