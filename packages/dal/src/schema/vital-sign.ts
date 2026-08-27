import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { encounter } from "./encounter.js";
import { patient } from "./patient.js";

export const vitalSign = pgTable("vital_sign", {
  id: uuid("id").primaryKey().defaultRandom(),
  encounterId: uuid("encounter_id")
    .notNull()
    .references(() => encounter.id, { onDelete: "cascade" }),
  // Denormalized so trend queries can filter by patient directly instead of
  // joining through encounter every time.
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  recordedByUserId: text("recorded_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  recordedByName: text("recorded_by_name").notNull(),
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  heartRate: integer("heart_rate"),
  respiratoryRate: integer("respiratory_rate"),
  temperatureCelsius: numeric("temperature_celsius", { precision: 4, scale: 1, mode: "number" }),
  oxygenSaturation: integer("oxygen_saturation"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1, mode: "number" }),
  heightCm: numeric("height_cm", { precision: 5, scale: 1, mode: "number" }),
  bmi: numeric("bmi", { precision: 4, scale: 1, mode: "number" }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});
