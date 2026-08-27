import { and, eq } from "drizzle-orm";
import { createDbClient } from "./client.js";
import { doctor } from "./schema/doctor.js";
import { labTestCatalogItem } from "./schema/laboratory.js";

const DOCTORS = [
  { name: "Dr. Alyana Cruz", specialization: "Family Medicine" },
  { name: "Dr. Marcus Reyes", specialization: "Internal Medicine" },
  { name: "Dr. Priya Santos", specialization: "Pediatrics" },
  { name: "Dr. Daniel Uy", specialization: "Cardiology" },
  { name: "Dr. Grace Tan", specialization: "Dermatology" },
];

// Categories with no example tests in the spec (Microbiology, Immunology,
// Pathology, Other) are intentionally left unseeded — the enum values
// exist and are ready for the deferred admin catalog-management UI.
const LAB_TEST_CATALOG: {
  category: (typeof labTestCatalogItem.$inferInsert)["category"];
  name: string;
}[] = [
  { category: "hematology", name: "CBC (Complete Blood Count)" },
  { category: "blood_chemistry", name: "Blood Chemistry Panel" },
  { category: "blood_chemistry", name: "FBS (Fasting Blood Sugar)" },
  { category: "blood_chemistry", name: "Lipid Profile" },
  { category: "urinalysis", name: "Urinalysis" },
  { category: "imaging", name: "ECG" },
  { category: "imaging", name: "Chest X-Ray" },
  { category: "imaging", name: "Ultrasound" },
  { category: "imaging", name: "CT Scan" },
  { category: "imaging", name: "MRI" },
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

for (const entry of LAB_TEST_CATALOG) {
  const [existing] = await db
    .select()
    .from(labTestCatalogItem)
    .where(
      and(eq(labTestCatalogItem.category, entry.category), eq(labTestCatalogItem.name, entry.name)),
    );
  if (!existing) {
    await db.insert(labTestCatalogItem).values(entry);
    console.log(`Seeded lab test: ${entry.name}`);
  } else {
    console.log(`Lab test already seeded: ${entry.name}`);
  }
}

console.log("Seed complete.");
process.exit(0);
