import type { NewPatient, Patient, PatientRepository } from "@healthcare/application";
import { eq } from "drizzle-orm";
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
    identificationDocumentPath: row.identificationDocumentPath,
    consentTreatment: row.consentTreatment,
    consentDisclosure: row.consentDisclosure,
    consentPrivacy: row.consentPrivacy,
  };
}

export class DrizzlePatientRepository implements PatientRepository {
  constructor(private db: Db) {}

  async create(input: NewPatient): Promise<Patient> {
    const [row] = await this.db.insert(patient).values(input).returning();
    if (!row) throw new Error("Failed to create patient");
    return toPatient(row);
  }

  async findByUserId(userId: string): Promise<Patient | null> {
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
}
