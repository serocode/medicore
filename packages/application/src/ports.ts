import type { AppointmentState, AppointmentStatus } from "@healthcare/domain";

export type StaffRole = "doctor" | "nurse";

export interface Doctor {
  id: string;
  userId: string | null;
  name: string;
  specialization: string;
  imageUrl: string | null;
  title: string | null;
  department: string | null;
  licenseNumber: string | null;
  contactPhone: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
}

export type NewDoctor = Omit<Doctor, "id">;

export interface Nurse {
  id: string;
  userId: string;
  name: string;
  title: string | null;
  department: string | null;
  licenseNumber: string | null;
  contactPhone: string | null;
  bio: string | null;
  imageUrl: string | null;
}

export type NewNurse = Omit<Nurse, "id">;

export type EncounterType =
  | "consultation"
  | "follow_up"
  | "nursing_check"
  | "vitals_only"
  | "other";

export interface Encounter {
  id: string;
  patientId: string;
  recordedByUserId: string;
  recordedByName: string;
  recordedByRole: StaffRole;
  encounterType: EncounterType;
  chiefComplaint: string | null;
  subjective: string | null;
  objectiveFindings: string | null;
  assessment: string | null;
  diagnosis: string | null;
  plan: string | null;
  recommendations: string | null;
  followUpInstructions: string | null;
  additionalNotes: string | null;
  occurredAt: Date;
}

export type NewEncounter = Omit<Encounter, "id" | "occurredAt"> & { occurredAt?: Date };

export interface VitalSign {
  id: string;
  encounterId: string;
  patientId: string;
  recordedByUserId: string;
  recordedByName: string;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperatureCelsius: number | null;
  oxygenSaturation: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  notes: string | null;
  recordedAt: Date;
}

export type NewVitalSign = Omit<VitalSign, "id" | "recordedAt">;

export interface Patient {
  id: string;
  userId: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  primaryPhysicianId: string;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  allergies: string | null;
  currentMedications: string | null;
  familyMedicalHistory: string | null;
  pastMedicalHistory: string | null;
  identificationType: string;
  identificationNumber: string;
  identificationDocumentPath: string | null;
  bloodType: string | null;
  consentTreatment: boolean;
  consentDisclosure: boolean;
  consentPrivacy: boolean;
  deletedAt: Date | null;
}

export type NewPatient = Omit<Patient, "id">;

// A lighter, name-joined shape for staff-facing patient lists — avoids
// pulling every intake field just to render a clickable row.
export interface PatientSummary {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  bloodType: string | null;
  allergies: string | null;
  primaryPhysicianId: string;
}

export interface Appointment extends AppointmentState {
  patientId: string;
  reason: string;
  preferredSchedule: Date;
  notes: string | null;
}

export interface NewAppointment {
  patientId: string;
  doctorId: string;
  reason: string;
  preferredSchedule: Date;
  notes?: string | null;
}

export interface AppointmentWithDetails extends Appointment {
  doctorName: string;
  doctorImageUrl: string | null;
  patientName: string;
}

export interface DoctorRepository {
  create(doctor: NewDoctor): Promise<Doctor>;
  list(): Promise<Doctor[]>;
  findById(id: string): Promise<Doctor | null>;
  findByUserId(userId: string): Promise<Doctor | null>;
  update(doctor: Doctor): Promise<Doctor>;
}

export interface NurseRepository {
  create(nurse: NewNurse): Promise<Nurse>;
  update(nurse: Nurse): Promise<Nurse>;
  findByUserId(userId: string): Promise<Nurse | null>;
  findById(id: string): Promise<Nurse | null>;
  list(): Promise<Nurse[]>;
}

export interface EncounterRepository {
  create(encounter: NewEncounter): Promise<Encounter>;
  listByPatientId(patientId: string): Promise<Encounter[]>;
}

export interface VitalSignRepository {
  create(vitalSign: NewVitalSign): Promise<VitalSign>;
  listByPatientId(patientId: string): Promise<VitalSign[]>;
}

export interface PatientRepository {
  create(patient: NewPatient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
  softDelete(patientId: string): Promise<void>;
  findByUserId(userId: string): Promise<Patient | null>;
  findByUserIdIncludingDeleted(userId: string): Promise<Patient | null>;
  findById(id: string): Promise<Patient | null>;
  getContactEmail(patientId: string): Promise<string | null>;
  getContactInfo(patientId: string): Promise<{ name: string; email: string } | null>;
  listActiveWithNames(): Promise<PatientSummary[]>;
}

export interface AppointmentRepository {
  create(appointment: NewAppointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  update(appointment: Appointment): Promise<Appointment>;
  listByPatientId(patientId: string): Promise<Appointment[]>;
  listAll(status?: AppointmentStatus): Promise<Appointment[]>;
  listByPatientIdDetailed(
    patientId: string,
    status?: AppointmentStatus,
  ): Promise<AppointmentWithDetails[]>;
  listAllDetailed(status?: AppointmentStatus): Promise<AppointmentWithDetails[]>;
  findScheduledForDoctorAt(doctorId: string, scheduledAt: Date): Promise<Appointment | null>;
  countByStatus(): Promise<Record<AppointmentStatus, number>>;
}
