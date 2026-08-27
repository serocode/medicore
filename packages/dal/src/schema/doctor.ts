import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const doctor = pgTable("doctor", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable + unique: existing picklist doctors aren't staff-linked until an
  // account is bootstrapped for them via DOCTOR_EMAILS; not every doctor row
  // needs to be a login-capable account.
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  imageUrl: text("image_url"),
  title: text("title"),
  department: text("department"),
  licenseNumber: text("license_number"),
  contactPhone: text("contact_phone"),
  bio: text("bio"),
  yearsOfExperience: integer("years_of_experience"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
