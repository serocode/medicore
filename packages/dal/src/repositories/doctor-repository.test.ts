import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { doctor } from "../schema/doctor.js";
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
      name,
      specialization: "Testology",
      imageUrl: null,
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
});
