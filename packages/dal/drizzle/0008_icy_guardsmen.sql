ALTER TABLE "patient" ALTER COLUMN "primary_physician_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "identification_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "identification_number" DROP NOT NULL;