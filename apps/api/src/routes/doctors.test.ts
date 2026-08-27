import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/doctors", () => {
  it("requires authentication", async () => {
    const res = await app.request("/api/doctors");
    expect(res.status).toBe(401);
  });

  it("returns the doctor list when signed in", async () => {
    const cookie = await signInAsPatient(app, "doctors-test@example.com");
    const res = await app.request("/api/doctors", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await readJson<{ doctors: unknown[] }>(res);
    expect(Array.isArray(body.doctors)).toBe(true);
  });
});
