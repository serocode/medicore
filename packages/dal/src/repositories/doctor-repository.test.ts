import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { doctor } from "../schema/doctor.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import { TEST_DATABASE_URL, ensureTestDatabase } from "../test-utils/test-db.js";
import { DrizzleDoctorRepository } from "./doctor-repository.js";

let db: Db;
let repo: DrizzleDoctorRepository;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleDoctorRepository(db);
});

describe("DrizzleDoctorRepository", () => {
  it("finds a doctor it just created, by id", async () => {
    const name = `Dr. ${randomUUID()}`;
    const [created] = await db
      .insert(doctor)
      .values({ name, specialization: "Testology" })
      .returning();
    if (!created) throw new Error("setup failed");

    const found = await repo.findById(created.id);
    expect(found).toEqual({
      id: created.id,
      userId: null,
      name,
      specialization: "Testology",
      imageUrl: null,
      title: null,
      department: null,
      licenseNumber: null,
      contactPhone: null,
      bio: null,
      yearsOfExperience: null,
    });
  });

  it("returns null for an unknown id", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });

  it("includes newly created doctors in list()", async () => {
    const name = `Dr. ${randomUUID()}`;
    await db.insert(doctor).values({ name, specialization: "Testology" });

    const all = await repo.list();
    expect(all.some((d) => d.name === name)).toBe(true);
  });

  it("finds a staff-linked doctor by userId", async () => {
    const testUser = await insertTestUser(db);
    const [created] = await db
      .insert(doctor)
      .values({ name: `Dr. ${randomUUID()}`, specialization: "Testology", userId: testUser.id })
      .returning();
    if (!created) throw new Error("setup failed");

    const found = await repo.findByUserId(testUser.id);
    expect(found?.id).toBe(created.id);
  });

  it("update() persists profile field changes", async () => {
    const [created] = await db
      .insert(doctor)
      .values({ name: `Dr. ${randomUUID()}`, specialization: "Testology" })
      .returning();
    if (!created) throw new Error("setup failed");

    const existing = await repo.findById(created.id);
    if (!existing) throw new Error("setup failed");

    const updated = await repo.update({ ...existing, department: "Cardiology" });
    expect(updated.department).toBe("Cardiology");
    expect((await repo.findById(created.id))?.department).toBe("Cardiology");
  });
});
