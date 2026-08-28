import type { AppointmentState, AppointmentStatus, LabResultStatus } from "@healthcare/domain";

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

export type LabTestCategory =
  | "hematology"
  | "blood_chemistry"
  | "urinalysis"
  | "microbiology"
  | "immunology"
  | "imaging"
  | "pathology"
  | "other";

export type LabResultFlag = "normal" | "abnormal" | "critical";

export interface LabTestCatalogItem {
  id: string;
  category: LabTestCategory;
  name: string;
  isActive: boolean;
}

export type NewLabTestCatalogItem = Omit<LabTestCatalogItem, "id">;

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

export type NewLabResultParameter = Omit<LabResultParameter, "id" | "labResultId">;

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
  requestedAt: Date;

  datePerformed: Date | null;
  dateReleased: Date | null;
  facility: string | null;
  findings: string | null;
  summary: string | null;
  interpretation: string | null;
  remarks: string | null;

  reportFilePath: string | null;
  uploadedByUserId: string | null;
  uploadedByName: string | null;
  uploadedByRole: StaffRole | null;
  uploadedAt: Date | null;

  reviewedByUserId: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  reviewInterpretation: string | null;
  reviewNotes: string | null;
  followUpRecommendation: string | null;
  actionTaken: string | null;

  cancellationReason: string | null;
}

export type NewLabResult = Omit<
  LabResult,
  "id" | "status" | "requestedAt" | "reportFilePath" | "reviewedAt"
> & { status?: LabResultStatus };

export interface LabResultWithPatientName extends LabResult {
  patientName: string;
}

export interface LabTestCatalogRepository {
  list(activeOnly?: boolean): Promise<LabTestCatalogItem[]>;
  findById(id: string): Promise<LabTestCatalogItem | null>;
}

export interface LabResultRepository {
  create(input: NewLabResult): Promise<LabResult>;
  findById(id: string): Promise<LabResult | null>;
  listByPatientId(patientId: string): Promise<LabResult[]>;
  listAll(statuses?: LabResultStatus[]): Promise<LabResult[]>;
  // Cross-patient, name-joined — backs the dashboard widgets, which need
  // "which patient" alongside the test, unlike the by-patient listing.
  listAllWithPatientName(statuses?: LabResultStatus[]): Promise<LabResultWithPatientName[]>;
  // `expectedStatus` guards against a lost update: the write only applies if
  // the row's status still matches what the caller read before validating
  // and building `labResult`. A mismatch means another request changed the
  // status concurrently, so the caller's decision is now stale.
  update(labResult: LabResult, expectedStatus: LabResultStatus): Promise<LabResult>;
  listParametersByLabResultId(labResultId: string): Promise<LabResultParameter[]>;
  replaceParameters(
    labResultId: string,
    parameters: NewLabResultParameter[],
  ): Promise<LabResultParameter[]>;
  findPatientIdByReportFilePath(storageKey: string): Promise<string | null>;
}

export type UserAccountRole = "patient" | "doctor" | "nurse" | "admin";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserAccountRole;
  disabledAt: Date | null;
  createdAt: Date;
}

export interface StaffInvite {
  email: string;
  role: "doctor" | "nurse" | "admin";
  invitedByUserId: string;
  createdAt: Date;
}

export interface NewStaffInvite {
  email: string;
  role: "doctor" | "nurse" | "admin";
  invitedByUserId: string;
}

export interface StaffAccountRepository {
  // Every non-patient account — the roster an admin manages.
  listStaffAndAdmins(): Promise<UserAccount[]>;
  findById(userId: string): Promise<UserAccount | null>;
  updateRole(userId: string, role: UserAccountRole): Promise<UserAccount>;
  setDisabled(userId: string, disabled: boolean): Promise<UserAccount>;
  // Immediately invalidates any of the user's active sessions — used when
  // disabling an account so access ends at once rather than at next
  // session-lookup (which would already reject them, but this is belt and
  // suspenders for a security-sensitive action).
  revokeSessions(userId: string): Promise<void>;

  listInvites(): Promise<StaffInvite[]>;
  findInvite(email: string): Promise<StaffInvite | null>;
  createInvite(invite: NewStaffInvite): Promise<StaffInvite>;
  deleteInvite(email: string): Promise<void>;
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
  listByDoctorIdDetailed(
    doctorId: string,
    status?: AppointmentStatus,
  ): Promise<AppointmentWithDetails[]>;
  listAllDetailed(status?: AppointmentStatus): Promise<AppointmentWithDetails[]>;
  findScheduledForDoctorAt(doctorId: string, scheduledAt: Date): Promise<Appointment | null>;
  countByStatus(): Promise<Record<AppointmentStatus, number>>;
}
