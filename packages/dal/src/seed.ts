import { eq } from "drizzle-orm";
import { createDbClient } from "./client.js";
import { doctor } from "./schema/doctor.js";

const DOCTORS = [
  { name: "Dr. Alyana Cruz", specialization: "Family Medicine" },
  { name: "Dr. Marcus Reyes", specialization: "Internal Medicine" },
  { name: "Dr. Priya Santos", specialization: "Pediatrics" },
  { name: "Dr. Daniel Uy", specialization: "Cardiology" },
  { name: "Dr. Grace Tan", specialization: "Dermatology" },
];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const db = createDbClient(databaseUrl);

for (const entry of DOCTORS) {
  const [existing] = await db.select().from(doctor).where(eq(doctor.name, entry.name));
  if (!existing) {
    await db.insert(doctor).values(entry);
    console.log(`Seeded doctor: ${entry.name}`);
  } else {
    console.log(`Doctor already seeded: ${entry.name}`);
  }
}

console.log("Seed complete.");
process.exit(0);
