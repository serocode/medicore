import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { doctor } from "./doctor.js";
import { patient } from "./patient.js";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "scheduled",
  "cancelled",
]);

export const appointment = pgTable("appointment", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctor.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  preferredSchedule: timestamp("preferred_schedule").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
