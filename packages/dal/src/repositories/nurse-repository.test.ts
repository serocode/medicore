import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { insertTestUser } from "../test-utils/fixtures.js";
import { TEST_DATABASE_URL, ensureTestDatabase, truncateAll } from "../test-utils/test-db.js";
import { DrizzleNurseRepository } from "./nurse-repository.js";

let db: Db;
let repo: DrizzleNurseRepository;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleNurseRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
});

function sampleNurse(userId: string) {
  return {
    userId,
    name: "Nurse Joy",
    title: null,
    department: null,
    licenseNumber: null,
    contactPhone: null,
    bio: null,
    imageUrl: null,
  };
}

describe("DrizzleNurseRepository", () => {
  it("creates a nurse and finds it by id and userId", async () => {
    const testUser = await insertTestUser(db);
    const created = await repo.create(sampleNurse(testUser.id));

    expect(await repo.findById(created.id)).toEqual(created);
    expect(await repo.findByUserId(testUser.id)).toEqual(created);
  });

  it("returns null when no nurse exists for a user", async () => {
    const testUser = await insertTestUser(db);
    expect(await repo.findByUserId(testUser.id)).toBeNull();
  });

  it("update() persists field changes", async () => {
    const testUser = await insertTestUser(db);
    const created = await repo.create(sampleNurse(testUser.id));

    const updated = await repo.update({ ...created, department: "ICU" });
    expect(updated.department).toBe("ICU");
    expect((await repo.findById(created.id))?.department).toBe("ICU");
  });

  it("includes newly created nurses in list()", async () => {
    const testUser = await insertTestUser(db);
    await repo.create({ ...sampleNurse(testUser.id), name: "Nurse List Test" });

    const all = await repo.list();
    expect(all.some((n) => n.name === "Nurse List Test")).toBe(true);
  });
});
