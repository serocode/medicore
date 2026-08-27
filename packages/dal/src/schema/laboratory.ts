import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { encounter, staffRoleEnum } from "./encounter.js";
import { patient } from "./patient.js";

export const labTestCategoryEnum = pgEnum("lab_test_category", [
  "hematology",
  "blood_chemistry",
  "urinalysis",
  "microbiology",
  "immunology",
  "imaging",
  "pathology",
  "other",
]);

export const labResultStatusEnum = pgEnum("lab_result_status", [
  "requested",
  "pending",
  "result_available",
  "reviewed",
  "cancelled",
]);

export const labResultFlagEnum = pgEnum("lab_result_flag", ["normal", "abnormal", "critical"]);

// The configurable test catalog (Section 2 of the spec: categories/tests
// should be data, not hardcoded). Seeded via `db:seed`; no admin-management
// UI yet — that's a deferred later phase.
export const labTestCatalogItem = pgTable("lab_test_catalog_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: labTestCategoryEnum("category").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Mutable, single-row-per-request lifecycle (like `appointment`), not
// append-only like `encounter` — a lab request genuinely transitions
// through Requested -> Pending -> Result Available -> Reviewed (or ->
// Cancelled), and each transition updates this same row.
export const labResult = pgTable("lab_result", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").references(() => encounter.id, { onDelete: "set null" }),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => labTestCatalogItem.id, { onDelete: "restrict" }),
  // Snapshotted at request time, same rationale as encounter.recordedByName:
  // renaming/reclassifying a catalog item later must not rewrite history.
  testName: text("test_name").notNull(),
  category: labTestCategoryEnum("category").notNull(),
  status: labResultStatusEnum("status").notNull().default("requested"),

  requestedByUserId: text("requested_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  requestedByName: text("requested_by_name").notNull(),
  requestedByRole: staffRoleEnum("requested_by_role").notNull(),
  requestNotes: text("request_notes"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),

  datePerformed: timestamp("date_performed"),
  dateReleased: timestamp("date_released"),
  facility: text("facility"),
  findings: text("findings"),
  summary: text("summary"),
  interpretation: text("interpretation"),
  remarks: text("remarks"),

  reportFilePath: text("report_file_path"),
  uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, { onDelete: "set null" }),
  uploadedByName: text("uploaded_by_name"),
  uploadedByRole: staffRoleEnum("uploaded_by_role"),
  uploadedAt: timestamp("uploaded_at"),

  // Reviewing is a distinct clinical act from uploading — a doctor's signed
  // read of the result, not just confirmation the file arrived.
  reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, { onDelete: "set null" }),
  reviewedByName: text("reviewed_by_name"),
  reviewedAt: timestamp("reviewed_at"),
  reviewInterpretation: text("review_interpretation"),
  reviewNotes: text("review_notes"),
  followUpRecommendation: text("follow_up_recommendation"),
  actionTaken: text("action_taken"),

  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Structured result parameters — a child table rather than JSON, matching
// the codebase's fully-relational style (see vital_sign). `value` stays
// text since results include non-numeric readings (e.g. "Reactive", "3+").
export const labResultParameter = pgTable("lab_result_parameter", {
  id: uuid("id").primaryKey().defaultRandom(),
  labResultId: uuid("lab_result_id")
    .notNull()
    .references(() => labResult.id, { onDelete: "cascade" }),
  parameterName: text("parameter_name").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  referenceRange: text("reference_range"),
  flag: labResultFlagEnum("flag"),
  remarks: text("remarks"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
