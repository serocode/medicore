import {
  DrizzleAppointmentRepository,
  DrizzleDoctorRepository,
  DrizzleEncounterRepository,
  DrizzleNurseRepository,
  DrizzlePatientRepository,
  DrizzleVitalSignRepository,
} from "@healthcare/dal";
import { db } from "./db.js";

export const doctorRepository = new DrizzleDoctorRepository(db);
export const nurseRepository = new DrizzleNurseRepository(db);
export const patientRepository = new DrizzlePatientRepository(db);
export const appointmentRepository = new DrizzleAppointmentRepository(db);
export const encounterRepository = new DrizzleEncounterRepository(db);
export const vitalSignRepository = new DrizzleVitalSignRepository(db);
