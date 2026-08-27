ALTER TABLE "patient" ADD COLUMN "identification_type" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "identification_number" text;--> statement-breakpoint
UPDATE "patient" SET "identification_type" = 'Unknown', "identification_number" = 'UNKNOWN' WHERE "identification_type" IS NULL;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "identification_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "identification_number" SET NOT NULL;