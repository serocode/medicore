import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { type Db, createDbClient } from "../client.js";
import { doctor } from "../schema/doctor.js";
import { labTestCatalogItem } from "../schema/laboratory.js";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_test";

function toMaintenanceUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

function databaseName(databaseUrl: string): string {
  return new URL(databaseUrl).pathname.replace(/^\//, "");
}

/**
 * Creates the test database (inside the same Postgres instance dev uses) if
 * it doesn't exist yet, then runs migrations against it. Safe to call before
 * every test run — both steps are no-ops once the database is up to date.
 */
export async function ensureTestDatabase(testDatabaseUrl: string): Promise<void> {
  const dbName = databaseName(testDatabaseUrl);
  const maintenanceClient = postgres(toMaintenanceUrl(testDatabaseUrl), { max: 1 });

  try {
    const existing = await maintenanceClient`select 1 from pg_database where datname = ${dbName}`;
    if (existing.length === 0) {
      await maintenanceClient.unsafe(`create database "${dbName}"`);
    }
  } finally {
    await maintenanceClient.end();
  }

  const db = createDbClient(testDatabaseUrl);
  try {
    await migrate(db, {
      migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
    });
  } finally {
    await db.$client.end();
  }
}

/**
 * Wipes every table a test could have written to. `doctor` now has a
 * nullable FK to `user` (staff accounts), so it — along with `nurse`,
 * `encounter`, and `vital_sign` — has to be included here too: Postgres's
 * `... CASCADE` truncates any table with a live FK to a truncated one based
 * on the schema, not on whether any row actually has a non-null value, so
 * `doctor` would get silently wiped as collateral either way. Because of
 * this, the fixture doctor `ensureTestDoctor` seeds does NOT survive across
 * calls to this function — callers must re-fetch it (call `ensureTestDoctor`
 * again) after every `truncateAll`, not just once in `beforeAll`.
 *
 * `lab_test_catalog_item` has no FK into any of the other truncated tables,
 * so unlike an FK-cascaded table it must be listed explicitly here or its
 * rows would silently accumulate/duplicate across test runs instead of
 * being wiped along with everything else.
 */
export async function truncateAll(db: Db): Promise<void> {
  await db.execute(
    sql`truncate table "lab_result_parameter", "lab_result", "lab_test_catalog_item", "vital_sign", "encounter", "appointment", "patient", "nurse", "doctor", "staff_invite", "session", "account", "verification", "user" restart identity cascade`,
  );
}

const TEST_DOCTOR_NAME = "Dr. Test Physician";

export async function ensureTestDoctor(db: Db): Promise<{ id: string; name: string }> {
  const [existing] = await db.select().from(doctor).where(eq(doctor.name, TEST_DOCTOR_NAME));
  if (existing) return existing;

  const [created] = await db
    .insert(doctor)
    .values({ name: TEST_DOCTOR_NAME, specialization: "General" })
    .returning();
  if (!created) throw new Error("Failed to seed test doctor");
  return created;
}

const TEST_LAB_TEST_NAME = "Test CBC";

// Same caveat as ensureTestDoctor: `lab_test_catalog_item` doesn't survive
// truncateAll, so callers must re-fetch it after every call, not just once
// in `beforeAll`.
export async function ensureTestLabTestCatalogItem(db: Db): Promise<{ id: string; name: string }> {
  const [existing] = await db
    .select()
    .from(labTestCatalogItem)
    .where(eq(labTestCatalogItem.name, TEST_LAB_TEST_NAME));
  if (existing) return existing;

  const [created] = await db
    .insert(labTestCatalogItem)
    .values({ category: "hematology", name: TEST_LAB_TEST_NAME })
    .returning();
  if (!created) throw new Error("Failed to seed test lab test catalog item");
  return created;
}
