CREATE TYPE "public"."encounter_type" AS ENUM('consultation', 'follow_up', 'nursing_check', 'vitals_only', 'other');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('doctor', 'nurse');--> statement-breakpoint
CREATE TABLE "nurse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"department" text,
	"license_number" text,
	"contact_phone" text,
	"bio" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nurse_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "encounter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"recorded_by_user_id" text NOT NULL,
	"recorded_by_name" text NOT NULL,
	"recorded_by_role" "staff_role" NOT NULL,
	"encounter_type" "encounter_type" NOT NULL,
	"chief_complaint" text,
	"subjective" text,
	"objective_findings" text,
	"assessment" text,
	"diagnosis" text,
	"plan" text,
	"recommendations" text,
	"follow_up_instructions" text,
	"additional_notes" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vital_sign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"recorded_by_user_id" text NOT NULL,
	"recorded_by_name" text NOT NULL,
	"bp_systolic" integer,
	"bp_diastolic" integer,
	"heart_rate" integer,
	"respiratory_rate" integer,
	"temperature_celsius" numeric(4, 1),
	"oxygen_saturation" integer,
	"weight_kg" numeric(5, 1),
	"height_cm" numeric(5, 1),
	"bmi" numeric(4, 1),
	"notes" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "license_number" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "doctor" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "blood_type" text;--> statement-breakpoint
ALTER TABLE "nurse" ADD CONSTRAINT "nurse_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_sign" ADD CONSTRAINT "vital_sign_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_sign" ADD CONSTRAINT "vital_sign_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_sign" ADD CONSTRAINT "vital_sign_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_user_id_unique" UNIQUE("user_id");