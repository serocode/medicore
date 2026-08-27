import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { type Db, createDbClient } from "../client.js";
import { doctor } from "../schema/doctor.js";

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
 * Wipes every table a test could have written to, except `doctor` — doctors
 * are seeded once via `ensureTestDoctor` and treated as fixture data.
 */
export async function truncateAll(db: Db): Promise<void> {
  await db.execute(
    sql`truncate table "appointment", "patient", "session", "account", "verification", "user" restart identity cascade`,
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
