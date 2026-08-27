import {
  DrizzleAppointmentRepository,
  DrizzleDoctorRepository,
  DrizzlePatientRepository,
} from "@healthcare/dal";
import { db } from "./db.js";

export const doctorRepository = new DrizzleDoctorRepository(db);
export const patientRepository = new DrizzlePatientRepository(db);
export const appointmentRepository = new DrizzleAppointmentRepository(db);
