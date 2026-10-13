import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import {
  signInAsAdmin,
  signInAsDoctor,
  signInAsNurse,
  signInAsPatient,
} from "../test-utils/api-test-client.js";
import { readJson } from "../test-utils/read-json.js";

beforeEach(async () => {
  await truncateAll(db);
});

interface StaffOverviewResponse {
  accounts: { id: string; email: string; role: string; disabledAt: string | null }[];
  pendingInvites: { email: string; role: string }[];
}

describe("GET /api/admin/staff", () => {
  it("rejects non-admin roles", async () => {
    const doctorCookie = await signInAsDoctor(app);
    const nurseCookie = await signInAsNurse(app);
    const patientCookie = await signInAsPatient(app, "admin-route-patient@example.com");

    for (const cookie of [doctorCookie, nurseCookie, patientCookie]) {
      const res = await app.request("/api/admin/staff", { headers: { Cookie: cookie } });
      expect(res.status).toBe(403);
    }
  });

  it("lists doctors, nurses, and admins but not patients", async () => {
    const adminCookie = await signInAsAdmin(app);
    await signInAsDoctor(app);
    await signInAsNurse(app);
    await signInAsPatient(app, "admin-route-list-patient@example.com");

    const res = await app.request("/api/admin/staff", { headers: { Cookie: adminCookie } });
    expect(res.status).toBe(200);
    const body = await readJson<StaffOverviewResponse>(res);
    const roles = body.accounts.map((a) => a.role).sort();
    expect(roles).toEqual(["admin", "doctor", "nurse"]);
  });
});

describe("PATCH /api/admin/staff/:userId", () => {
  it("changes a doctor's role to nurse and provisions a nurse profile", async () => {
    const adminCookie = await signInAsAdmin(app);
    const doctorCookie = await signInAsDoctor(app);
    const doctorMe = await app.request("/api/staff/me", { headers: { Cookie: doctorCookie } });
    const { doctor } = await readJson<{ doctor: { userId: string } }>(doctorMe);

    const patchRes = await app.request(`/api/admin/staff/${doctor.userId}`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "nurse" }),
    });
    expect(patchRes.status).toBe(200);
    const { account } = await readJson<{ account: { role: string } }>(patchRes);
    expect(account.role).toBe("nurse");

    // The now-nurse account can access nurse-only endpoints and has a
    // provisioned nurse profile, not just a role string change.
    const nurseMeRes = await app.request("/api/staff/me", { headers: { Cookie: doctorCookie } });
    expect(nurseMeRes.status).toBe(200);
    const nurseBody = await readJson<{ role: string; nurse: { name: string } }>(nurseMeRes);
    expect(nurseBody.role).toBe("nurse");
    expect(nurseBody.nurse.name).toBeTruthy();
  });

  it("rejects an admin changing their own role", async () => {
    const adminCookie = await signInAsAdmin(app);
    const listRes = await app.request("/api/admin/staff", { headers: { Cookie: adminCookie } });
    const overview = await readJson<StaffOverviewResponse>(listRes);
    const self = overview.accounts.find((a) => a.role === "admin");
    expect(self).toBeTruthy();

    const res = await app.request(`/api/admin/staff/${self?.id}`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "doctor" }),
    });
    expect(res.status).toBe(403);
  });

  it("disables an account and blocks its next authenticated request", async () => {
    const adminCookie = await signInAsAdmin(app);
    const doctorCookie = await signInAsDoctor(app);

    const doctorMe = await app.request("/api/staff/me", { headers: { Cookie: doctorCookie } });
    const { doctor } = await readJson<{ doctor: { userId: string } }>(doctorMe);

    const disableRes = await app.request(`/api/admin/staff/${doctor.userId}`, {
      method: "PATCH",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: true }),
    });
    expect(disableRes.status).toBe(200);

    const blockedRes = await app.request("/api/staff/me", { headers: { Cookie: doctorCookie } });
    expect(blockedRes.status).toBe(401);
  });

  it("rejects non-admin roles", async () => {
    const doctorCookie = await signInAsDoctor(app);
    const nurseCookie = await signInAsNurse(app);
    const res = await app.request("/api/admin/staff/some-id", {
      method: "PATCH",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: true }),
    });
    expect(res.status).toBe(403);
    const res2 = await app.request("/api/admin/staff/some-id", {
      method: "PATCH",
      headers: { Cookie: nurseCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: true }),
    });
    expect(res2.status).toBe(403);
  });
});

describe("POST /api/admin/invites and sign-in role assignment", () => {
  it("assigns the invited role on first sign-in and consumes the invite", async () => {
    const adminCookie = await signInAsAdmin(app);
    const email = "invited-nurse@example.com";

    const inviteRes = await app.request("/api/admin/invites", {
      method: "POST",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "nurse" }),
    });
    expect(inviteRes.status).toBe(201);

    const overviewBefore = await readJson<StaffOverviewResponse>(
      await app.request("/api/admin/staff", { headers: { Cookie: adminCookie } }),
    );
    expect(overviewBefore.pendingInvites.some((i) => i.email === email)).toBe(true);

    const newStaffCookie = await signInAsPatient(app, email);
    const meRes = await app.request("/api/staff/me", { headers: { Cookie: newStaffCookie } });
    expect(meRes.status).toBe(200);
    const body = await readJson<{ role: string }>(meRes);
    expect(body.role).toBe("nurse");

    const overviewAfter = await readJson<StaffOverviewResponse>(
      await app.request("/api/admin/staff", { headers: { Cookie: adminCookie } }),
    );
    expect(overviewAfter.pendingInvites.some((i) => i.email === email)).toBe(false);
  });

  it("emails the invitation to the invited address", async () => {
    const adminCookie = await signInAsAdmin(app);
    const email = "invited-doctor@example.com";

    // No RESEND_API_KEY under test, so the email goes to the dev console
    // fallback — the same channel the sign-in helpers read OTPs from.
    const logs: string[] = [];
    const log = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    let res: Response;
    try {
      res = await app.request("/api/admin/invites", {
        method: "POST",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "doctor" }),
      });
    } finally {
      log.mockRestore();
    }

    expect(res.status).toBe(201);
    expect((await readJson<{ emailSent: boolean }>(res)).emailSent).toBe(true);
    const sent = logs.find((line) => line.includes(`To ${email}`));
    expect(sent).toContain("You've been invited to Medicore");
    expect(sent).toContain("as a doctor");
    expect(sent).toContain("/sign-in");
  });

  it("rejects a non-admin sending an invite", async () => {
    const doctorCookie = await signInAsDoctor(app);
    const res = await app.request("/api/admin/invites", {
      method: "POST",
      headers: { Cookie: doctorCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "someone@example.com", role: "nurse" }),
    });
    expect(res.status).toBe(403);
  });
});
