import { ensureTestDoctor, truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsAdmin, signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";
import { registerTestPatient } from "../test-utils/register-patient.js";

interface PatientResponse {
  patient: { identificationDocumentPath: string | null };
}

let doctorId: string;

beforeEach(async () => {
  await truncateAll(db);
  // truncateAll wipes `doctor` too (it now has a live FK to `user`), so the
  // fixture doctor must be re-seeded — and re-captured — every time.
  doctorId = (await ensureTestDoctor(db)).id;
});

describe("GET /api/uploads/:key", () => {
  it("lets the owning patient read their own document", async () => {
    const cookie = await signInAsPatient(app, "owner@example.com");
    const registerRes = await registerTestPatient(app, { cookie, doctorId });
    const { patient } = await readJson<PatientResponse>(registerRes);

    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
  });

  it("denies a different patient", async () => {
    const ownerCookie = await signInAsPatient(app, "owner2@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const otherCookie = await signInAsPatient(app, "other@example.com");
    await registerTestPatient(app, { cookie: otherCookie, doctorId });

    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: otherCookie },
    });
    expect(res.status).toBe(403);
  });

  it("lets an admin read any patient's document", async () => {
    const ownerCookie = await signInAsPatient(app, "owner3@example.com");
    const { patient } = await readJson<PatientResponse>(
      await registerTestPatient(app, { cookie: ownerCookie, doctorId }),
    );

    const adminCookie = await signInAsAdmin(app);
    const res = await app.request(`/api/uploads/${patient.identificationDocumentPath}`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
  });

  it("rejects a path-traversal-shaped key", async () => {
    const adminCookie = await signInAsAdmin(app);
    const res = await app.request("/api/uploads/..%2f..%2fetc%2fpasswd", {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(404);
  });
});
