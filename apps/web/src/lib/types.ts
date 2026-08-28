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

export const NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"] as const;
export type NameSuffix = (typeof NAME_SUFFIXES)[number];

/** The signed-in person's own account row — name in parts, plus their photo. */
export interface AccountProfile {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  imagePath: string | null;
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

export type UserAccountRole = "patient" | "doctor" | "nurse" | "admin";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserAccountRole;
  disabledAt: string | null;
  createdAt: string;
}

export interface StaffInvite {
  email: string;
  role: "doctor" | "nurse" | "admin";
  invitedByUserId: string;
  createdAt: string;
}

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

export type LabTestCategory =
  | "hematology"
  | "blood_chemistry"
  | "urinalysis"
  | "microbiology"
  | "immunology"
  | "imaging"
  | "pathology"
  | "other";

export type LabResultStatus =
  | "requested"
  | "pending"
  | "result_available"
  | "reviewed"
  | "cancelled";

export type LabResultFlag = "normal" | "abnormal" | "critical";

export interface LabTestCatalogItem {
  id: string;
  category: LabTestCategory;
  name: string;
  isActive: boolean;
}

export interface LabResultParameter {
  id: string;
  labResultId: string;
  parameterName: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: LabResultFlag | null;
  remarks: string | null;
  sortOrder: number;
}

export interface LabResult {
  id: string;
  patientId: string;
  encounterId: string | null;
  catalogItemId: string;
  testName: string;
  category: LabTestCategory;
  status: LabResultStatus;

  requestedByUserId: string;
  requestedByName: string;
  requestedByRole: StaffRole;
  requestNotes: string | null;
  requestedAt: string;

  datePerformed: string | null;
  dateReleased: string | null;
  facility: string | null;
  findings: string | null;
  summary: string | null;
  interpretation: string | null;
  remarks: string | null;

  reportFilePath: string | null;
  uploadedByUserId: string | null;
  uploadedByName: string | null;
  uploadedByRole: StaffRole | null;
  uploadedAt: string | null;

  reviewedByUserId: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewInterpretation: string | null;
  reviewNotes: string | null;
  followUpRecommendation: string | null;
  actionTaken: string | null;

  cancellationReason: string | null;
}

export interface LabResultWithPatientName extends LabResult {
  patientName: string;
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
