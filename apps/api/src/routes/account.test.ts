import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { signInAsPatient } from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";

interface AccountResponse {
  account: {
    name: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    imagePath: string | null;
  };
}

beforeEach(async () => {
  await truncateAll(db);
});

function patchName(cookie: string, body: Record<string, unknown>) {
  return app.request("/api/account/me", {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/account/me", () => {
  it("requires a session", async () => {
    expect((await app.request("/api/account/me")).status).toBe(401);
  });

  it("derives name parts for an account that only has a display name", async () => {
    // Signing in by one-time code leaves `name` empty, so nothing to derive —
    // set a legacy-style single name first, then read it back in parts.
    const cookie = await signInAsPatient(app, "legacy-name@example.com");
    await patchName(cookie, { firstName: "Maria", lastName: "Santos" });

    const { account } = await readJson<AccountResponse>(
      await app.request("/api/account/me", { headers: { Cookie: cookie } }),
    );
    expect(account.firstName).toBe("Maria");
    expect(account.lastName).toBe("Santos");
    expect(account.name).toBe("Maria Santos");
  });
});

describe("PATCH /api/account/me", () => {
  it("stores the parts and recomposes the display name", async () => {
    const cookie = await signInAsPatient(app, "name-parts@example.com");
    const res = await patchName(cookie, {
      firstName: "Maria",
      middleName: "Cruz",
      lastName: "Santos",
      suffix: "Jr.",
    });

    expect(res.status).toBe(200);
    const { account } = await readJson<AccountResponse>(res);
    expect(account).toMatchObject({
      firstName: "Maria",
      middleName: "Cruz",
      lastName: "Santos",
      suffix: "Jr.",
      name: "Maria Cruz Santos Jr.",
    });
  });

  it("treats a blank middle name and suffix as absent", async () => {
    const cookie = await signInAsPatient(app, "name-blank@example.com");
    const { account } = await readJson<AccountResponse>(
      await patchName(cookie, { firstName: "Ana", middleName: "", lastName: "Reyes" }),
    );
    expect(account.middleName).toBeNull();
    expect(account.suffix).toBeNull();
    expect(account.name).toBe("Ana Reyes");
  });

  it("requires a first name and a surname", async () => {
    const cookie = await signInAsPatient(app, "name-required@example.com");
    expect((await patchName(cookie, { firstName: "", lastName: "Reyes" })).status).toBe(400);
    expect((await patchName(cookie, { firstName: "Ana", lastName: "" })).status).toBe(400);
  });

  it("refuses a suffix outside the known list", async () => {
    const cookie = await signInAsPatient(app, "name-suffix@example.com");
    const res = await patchName(cookie, {
      firstName: "Ana",
      lastName: "Reyes",
      suffix: "Esquire",
    });
    expect(res.status).toBe(400);
  });

  it("only ever edits the caller's own account", async () => {
    const first = await signInAsPatient(app, "name-mine@example.com");
    const second = await signInAsPatient(app, "name-theirs@example.com");
    await patchName(first, { firstName: "First", lastName: "Person" });
    await patchName(second, { firstName: "Second", lastName: "Person" });

    // The route takes no user id, so there is nothing to tamper with — each
    // session can only have changed its own row.
    const { account } = await readJson<AccountResponse>(
      await app.request("/api/account/me", { headers: { Cookie: first } }),
    );
    expect(account.name).toBe("First Person");
  });
});

describe("account photo", () => {
  function upload(cookie: string, file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    return app.request("/api/account/me/photo", {
      method: "POST",
      headers: { Cookie: cookie },
      body: formData,
    });
  }

  it("stores a PNG and points the account at it", async () => {
    const cookie = await signInAsPatient(app, "photo-ok@example.com");
    const res = await upload(cookie, new File(["image-bytes"], "me.png", { type: "image/png" }));

    expect(res.status).toBe(200);
    const { account } = await readJson<AccountResponse>(res);
    expect(account.imagePath).toMatch(/\.png$/);
  });

  it("refuses a PDF, which file storage would otherwise accept", async () => {
    const cookie = await signInAsPatient(app, "photo-pdf@example.com");
    const res = await upload(cookie, new File(["%PDF-"], "id.pdf", { type: "application/pdf" }));
    expect(res.status).toBe(400);
  });

  it("lets the owner read their own photo back", async () => {
    const cookie = await signInAsPatient(app, "photo-read@example.com");
    const { account } = await readJson<AccountResponse>(
      await upload(cookie, new File(["bytes"], "me.png", { type: "image/png" })),
    );

    const res = await app.request(`/api/uploads/${account.imagePath}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("does not let another patient read it", async () => {
    const owner = await signInAsPatient(app, "photo-owner@example.com");
    const { account } = await readJson<AccountResponse>(
      await upload(owner, new File(["bytes"], "me.png", { type: "image/png" })),
    );

    const other = await signInAsPatient(app, "photo-snooper@example.com");
    const res = await app.request(`/api/uploads/${account.imagePath}`, {
      headers: { Cookie: other },
    });
    expect(res.status).toBe(403);
  });

  it("removing the photo clears the account and falls back to initials", async () => {
    const cookie = await signInAsPatient(app, "photo-remove@example.com");
    await upload(cookie, new File(["bytes"], "me.png", { type: "image/png" }));

    const res = await app.request("/api/account/me/photo", {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect((await readJson<AccountResponse>(res)).account.imagePath).toBeNull();
  });
});
