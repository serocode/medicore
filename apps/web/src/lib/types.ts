export type AppointmentStatus = "pending" | "scheduled" | "cancelled";

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
  deletedAt: string | null;
}

export interface PatientSummary {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  bloodType: string | null;
  allergies: string | null;
  primaryPhysicianId: string;
}

export type StaffRole = "doctor" | "nurse";

export interface DoctorProfile {
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

export interface NurseProfile {
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

export type StaffProfile =
  | { role: "doctor"; doctor: DoctorProfile }
  | { role: "nurse"; nurse: NurseProfile };

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
  occurredAt: string;
}

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
  recordedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  reason: string;
  preferredSchedule: string;
  scheduledAt: string | null;
  status: AppointmentStatus;
  cancellationReason: string | null;
  notes: string | null;
  doctorName: string;
  doctorImageUrl: string | null;
  patientName: string;
}
