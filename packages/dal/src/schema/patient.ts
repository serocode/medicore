import { boolean, date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { doctor } from "./doctor.js";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const patient = pgTable("patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  birthDate: date("birth_date").notNull(),
  gender: genderEnum("gender").notNull(),
  address: text("address").notNull(),
  occupation: text("occupation").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  primaryPhysicianId: uuid("primary_physician_id")
    .notNull()
    .references(() => doctor.id, { onDelete: "restrict" }),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  familyMedicalHistory: text("family_medical_history"),
  pastMedicalHistory: text("past_medical_history"),
  identificationDocumentPath: text("identification_document_path"),
  consentTreatment: boolean("consent_treatment").notNull(),
  consentDisclosure: boolean("consent_disclosure").notNull(),
  consentPrivacy: boolean("consent_privacy").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
