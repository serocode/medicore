import type {
  NewPatient,
  Patient,
  PatientRepository,
  PatientSummary,
} from "@healthcare/application";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client.js";
import { user } from "../schema/auth.js";
import { patient } from "../schema/patient.js";

function toPatient(row: typeof patient.$inferSelect): Patient {
  return {
    id: row.id,
    userId: row.userId,
    birthDate: row.birthDate,
    gender: row.gender,
    address: row.address,
    occupation: row.occupation,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    primaryPhysicianId: row.primaryPhysicianId,
    insuranceProvider: row.insuranceProvider,
    insurancePolicyNumber: row.insurancePolicyNumber,
    allergies: row.allergies,
    currentMedications: row.currentMedications,
    familyMedicalHistory: row.familyMedicalHistory,
    pastMedicalHistory: row.pastMedicalHistory,
    identificationType: row.identificationType,
    identificationNumber: row.identificationNumber,
    identificationDocumentPath: row.identificationDocumentPath,
    bloodType: row.bloodType,
    consentTreatment: row.consentTreatment,
    consentDisclosure: row.consentDisclosure,
    consentPrivacy: row.consentPrivacy,
    deletedAt: row.deletedAt,
  };
}

export class DrizzlePatientRepository implements PatientRepository {
  constructor(private db: Db) {}

  async create(input: NewPatient): Promise<Patient> {
    const [row] = await this.db.insert(patient).values(input).returning();
    if (!row) throw new Error("Failed to create patient");
    return toPatient(row);
  }

  async update(input: Patient): Promise<Patient> {
    const [row] = await this.db
      .update(patient)
      .set({
        birthDate: input.birthDate,
        gender: input.gender,
        address: input.address,
        occupation: input.occupation,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        primaryPhysicianId: input.primaryPhysicianId,
        insuranceProvider: input.insuranceProvider,
        insurancePolicyNumber: input.insurancePolicyNumber,
        allergies: input.allergies,
        currentMedications: input.currentMedications,
        familyMedicalHistory: input.familyMedicalHistory,
        pastMedicalHistory: input.pastMedicalHistory,
        identificationType: input.identificationType,
        identificationNumber: input.identificationNumber,
        identificationDocumentPath: input.identificationDocumentPath,
        bloodType: input.bloodType,
        consentTreatment: input.consentTreatment,
        consentDisclosure: input.consentDisclosure,
        consentPrivacy: input.consentPrivacy,
        deletedAt: input.deletedAt,
        updatedAt: new Date(),
      })
      .where(eq(patient.id, input.id))
      .returning();
    if (!row) throw new Error("Failed to update patient");
    return toPatient(row);
  }

  async softDelete(patientId: string): Promise<void> {
    await this.db
      .update(patient)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(patient.id, patientId));
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const [row] = await this.db
      .select()
      .from(patient)
      .where(and(eq(patient.userId, userId), isNull(patient.deletedAt)));
    return row ? toPatient(row) : null;
  }

  async findByUserIdIncludingDeleted(userId: string): Promise<Patient | null> {
    const [row] = await this.db.select().from(patient).where(eq(patient.userId, userId));
    return row ? toPatient(row) : null;
  }

  async findById(id: string): Promise<Patient | null> {
    const [row] = await this.db.select().from(patient).where(eq(patient.id, id));
    return row ? toPatient(row) : null;
  }

  async getContactEmail(patientId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ email: user.email })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(eq(patient.id, patientId));
    return row?.email ?? null;
  }

  async getContactInfo(patientId: string): Promise<{ name: string; email: string } | null> {
    const [row] = await this.db
      .select({ name: user.name, email: user.email })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(eq(patient.id, patientId));
    return row ?? null;
  }

  async listActiveWithNames(): Promise<PatientSummary[]> {
    const rows = await this.db
      .select({
        id: patient.id,
        name: user.name,
        birthDate: patient.birthDate,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        primaryPhysicianId: patient.primaryPhysicianId,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(isNull(patient.deletedAt))
      .orderBy(asc(user.name));
    return rows;
  }
}
