CREATE TYPE "public"."lab_result_flag" AS ENUM('normal', 'abnormal', 'critical');--> statement-breakpoint
CREATE TYPE "public"."lab_result_status" AS ENUM('requested', 'pending', 'result_available', 'reviewed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lab_test_category" AS ENUM('hematology', 'blood_chemistry', 'urinalysis', 'microbiology', 'immunology', 'imaging', 'pathology', 'other');--> statement-breakpoint
CREATE TABLE "lab_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"catalog_item_id" uuid NOT NULL,
	"test_name" text NOT NULL,
	"category" "lab_test_category" NOT NULL,
	"status" "lab_result_status" DEFAULT 'requested' NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"requested_by_role" "staff_role" NOT NULL,
	"request_notes" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"date_performed" timestamp,
	"date_released" timestamp,
	"facility" text,
	"findings" text,
	"summary" text,
	"interpretation" text,
	"remarks" text,
	"report_file_path" text,
	"uploaded_by_user_id" text,
	"uploaded_by_name" text,
	"uploaded_by_role" "staff_role",
	"uploaded_at" timestamp,
	"reviewed_by_user_id" text,
	"reviewed_by_name" text,
	"reviewed_at" timestamp,
	"review_interpretation" text,
	"review_notes" text,
	"follow_up_recommendation" text,
	"action_taken" text,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_result_parameter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_result_id" uuid NOT NULL,
	"parameter_name" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"reference_range" text,
	"flag" "lab_result_flag",
	"remarks" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_test_catalog_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "lab_test_category" NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_catalog_item_id_lab_test_catalog_item_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."lab_test_catalog_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result" ADD CONSTRAINT "lab_result_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result_parameter" ADD CONSTRAINT "lab_result_parameter_lab_result_id_lab_result_id_fk" FOREIGN KEY ("lab_result_id") REFERENCES "public"."lab_result"("id") ON DELETE cascade ON UPDATE no action;