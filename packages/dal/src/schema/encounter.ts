import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { patient } from "./patient.js";

export const encounterTypeEnum = pgEnum("encounter_type", [
  "consultation",
  "follow_up",
  "nursing_check",
  "vitals_only",
  "other",
]);

export const staffRoleEnum = pgEnum("staff_role", ["doctor", "nurse"]);

// Append-only by design: no update/delete route exists for encounters. A
// correction is a new encounter, not an edit to an old one — preserves the
// clinical record instead of silently overwriting history.
export const encounter = pgTable("encounter", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  recordedByUserId: text("recorded_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  // Captured at write time rather than joined at read time: a signed
  // clinical note should keep showing who signed it then, even if that
  // staff member's profile name changes later.
  recordedByName: text("recorded_by_name").notNull(),
  recordedByRole: staffRoleEnum("recorded_by_role").notNull(),
  encounterType: encounterTypeEnum("encounter_type").notNull(),
  chiefComplaint: text("chief_complaint"),
  subjective: text("subjective"),
  objectiveFindings: text("objective_findings"),
  assessment: text("assessment"),
  diagnosis: text("diagnosis"),
  plan: text("plan"),
  recommendations: text("recommendations"),
  followUpInstructions: text("follow_up_instructions"),
  additionalNotes: text("additional_notes"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
