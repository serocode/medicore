import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const doctor = pgTable("doctor", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
