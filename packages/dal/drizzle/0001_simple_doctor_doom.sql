CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'scheduled', 'cancelled');--> statement-breakpoint
CREATE TABLE "doctor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialization" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"birth_date" date NOT NULL,
	"gender" "gender" NOT NULL,
	"address" text NOT NULL,
	"occupation" text NOT NULL,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_phone" text NOT NULL,
	"primary_physician_id" uuid NOT NULL,
	"insurance_provider" text,
	"insurance_policy_number" text,
	"allergies" text,
	"current_medications" text,
	"family_medical_history" text,
	"past_medical_history" text,
	"identification_document_path" text,
	"consent_treatment" boolean NOT NULL,
	"consent_disclosure" boolean NOT NULL,
	"consent_privacy" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"preferred_schedule" timestamp NOT NULL,
	"scheduled_at" timestamp,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"cancellation_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'patient' NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_primary_physician_id_doctor_id_fk" FOREIGN KEY ("primary_physician_id") REFERENCES "public"."doctor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE restrict ON UPDATE no action;