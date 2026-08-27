import { labTestCatalogItem } from "@healthcare/dal/src/schema/laboratory.js";
import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsDoctor, signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/lab-test-catalog", () => {
  it("returns only active catalog items", async () => {
    await db
      .insert(labTestCatalogItem)
      .values({ category: "hematology", name: "CBC", isActive: true });
    await db.insert(labTestCatalogItem).values({
      category: "hematology",
      name: "Retired Test",
      isActive: false,
    });

    const doctorCookie = await signInAsDoctor(app);
    const res = await app.request("/api/lab-test-catalog", { headers: { Cookie: doctorCookie } });
    expect(res.status).toBe(200);
    const body = await readJson<{ catalog: { name: string }[] }>(res);
    expect(body.catalog.map((item) => item.name)).toEqual(["CBC"]);
  });

  it("rejects a patient", async () => {
    const patientCookie = await signInAsPatient(app, "lab-catalog-patient@example.com");
    const res = await app.request("/api/lab-test-catalog", { headers: { Cookie: patientCookie } });
    expect(res.status).toBe(403);
  });
});
