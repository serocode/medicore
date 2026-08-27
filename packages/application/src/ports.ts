import type { AppointmentState, AppointmentStatus } from "@healthcare/domain";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  imageUrl: string | null;
}

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
  identificationDocumentPath: string | null;
  consentTreatment: boolean;
  consentDisclosure: boolean;
  consentPrivacy: boolean;
}

export type NewPatient = Omit<Patient, "id">;

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
}

export interface DoctorRepository {
  list(): Promise<Doctor[]>;
  findById(id: string): Promise<Doctor | null>;
}

export interface PatientRepository {
  create(patient: NewPatient): Promise<Patient>;
  findByUserId(userId: string): Promise<Patient | null>;
  findById(id: string): Promise<Patient | null>;
  getContactEmail(patientId: string): Promise<string | null>;
}

export interface AppointmentRepository {
  create(appointment: NewAppointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  update(appointment: Appointment): Promise<Appointment>;
  listByPatientId(patientId: string): Promise<Appointment[]>;
  listAll(status?: AppointmentStatus): Promise<Appointment[]>;
  findScheduledForDoctorAt(doctorId: string, scheduledAt: Date): Promise<Appointment | null>;
  countByStatus(): Promise<Record<AppointmentStatus, number>>;
}
