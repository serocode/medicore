CREATE TYPE "public"."staff_invite_role" AS ENUM('doctor', 'nurse', 'admin');--> statement-breakpoint
CREATE TABLE "staff_invite" (
	"email" text PRIMARY KEY NOT NULL,
	"role" "staff_invite_role" NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "staff_invite" ADD CONSTRAINT "staff_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;