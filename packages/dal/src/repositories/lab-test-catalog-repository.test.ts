import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type Db, createDbClient } from "../client.js";
import { labTestCatalogItem } from "../schema/laboratory.js";
import { TEST_DATABASE_URL, ensureTestDatabase, truncateAll } from "../test-utils/test-db.js";
import { DrizzleLabTestCatalogRepository } from "./lab-test-catalog-repository.js";

let db: Db;
let repo: DrizzleLabTestCatalogRepository;

beforeAll(async () => {
  await ensureTestDatabase(TEST_DATABASE_URL);
  db = createDbClient(TEST_DATABASE_URL);
  repo = new DrizzleLabTestCatalogRepository(db);
});

beforeEach(async () => {
  await truncateAll(db);
});

describe("DrizzleLabTestCatalogRepository", () => {
  it("lists only active items when activeOnly is true", async () => {
    const [active] = await db
      .insert(labTestCatalogItem)
      .values({ category: "hematology", name: "CBC", isActive: true })
      .returning();
    await db
      .insert(labTestCatalogItem)
      .values({ category: "hematology", name: "Retired Test", isActive: false })
      .returning();

    const activeOnly = await repo.list(true);
    expect(activeOnly.map((item) => item.id)).toEqual([active?.id]);

    const all = await repo.list();
    expect(all).toHaveLength(2);
  });

  it("finds a catalog item by id", async () => {
    const [created] = await db
      .insert(labTestCatalogItem)
      .values({ category: "imaging", name: "Chest X-Ray" })
      .returning();

    const found = await repo.findById(created?.id ?? "");
    expect(found?.name).toBe("Chest X-Ray");
    expect(found?.category).toBe("imaging");
  });

  it("returns null for an unknown id", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });
});
