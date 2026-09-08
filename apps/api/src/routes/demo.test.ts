import { DEMO_ACCOUNTS, DEMO_OTP } from "@healthcare/dal";
import { truncateAll } from "@healthcare/dal/src/test-utils/test-db.js";
import type { Hono } from "hono";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import { db } from "../db.js";
import { readJson } from "../test-utils/read-json.js";

interface DemoResponse {
  enabled: boolean;
  otp?: string;
  accounts?: { email: string; role: string }[];
}

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/demo", () => {
  it("reports demo mode off, and leaks nothing else, by default", async () => {
    const res = await app.request("/api/demo");
    expect(res.status).toBe(200);
    expect(await readJson<DemoResponse>(res)).toEqual({ enabled: false });
  });
});

// DEMO_MODE is read once, at module load, so exercising it means building a
// second module graph with the variable set.
describe("with DEMO_MODE enabled", () => {
  let demoApp: Hono;
  let demoDb: typeof db;

  beforeAll(async () => {
    vi.resetModules();
    process.env.DEMO_MODE = "true";
    demoApp = (await import("../app.js")).app;
    // The isolated graph opens its own pool against the same database; it has
    // to be closed here or the run hangs on the open handle.
    demoDb = (await import("../db.js")).db;
  });

  afterAll(async () => {
    await demoDb.$client.end();
    // "false", not `undefined` — assigning undefined to process.env stores
    // the *string* "undefined", which the env schema rejects.
    process.env.DEMO_MODE = "false";
    vi.resetModules();
  });

  it("publishes the fixed code and the seeded demo accounts", async () => {
    const res = await demoApp.request("/api/demo");
    expect(res.status).toBe(200);
    const body = await readJson<DemoResponse>(res);
    expect(body.enabled).toBe(true);
    expect(body.otp).toBe(DEMO_OTP);
    expect(body.accounts?.map((a) => a.email)).toEqual(DEMO_ACCOUNTS.map((a) => a.email));
  });

  it("accepts the fixed code as a real sign-in", async () => {
    const email = "demo-mode-test@example.com";
    await demoApp.request("/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "sign-in" }),
    });

    const res = await demoApp.request("/api/auth/sign-in/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: DEMO_OTP }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie().length).toBeGreaterThan(0);
  });
});

describe("DEMO_MODE in production", () => {
  it("refuses to load the environment at all", async () => {
    // Always "test" here — vitest.config.ts sets it for every worker.
    const previousNodeEnv = process.env.NODE_ENV ?? "test";
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "true";
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../env.js")).rejects.toThrow("Invalid environment configuration");

    consoleError.mockRestore();
    process.env.NODE_ENV = previousNodeEnv;
    process.env.DEMO_MODE = "false";
    vi.resetModules();
  });
});
