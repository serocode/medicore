import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const nurse = pgTable("nurse", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  department: text("department"),
  licenseNumber: text("license_number"),
  contactPhone: text("contact_phone"),
  bio: text("bio"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
