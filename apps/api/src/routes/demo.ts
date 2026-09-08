import { DEMO_ACCOUNTS, DEMO_OTP } from "@healthcare/dal";
import { Hono } from "hono";
import { env } from "../env.js";

export const demoRoute = new Hono();

/**
 * What the sign-in page needs to offer one-click demo sign-ins: whether demo
 * mode is on, the fixed code, and the accounts `pnpm db:seed:demo` creates.
 *
 * Unauthenticated on purpose — it is the sign-in page that asks, before
 * anyone has a session. Nothing here is a secret while DEMO_MODE is on (the
 * whole point is that the code is published), and when it is off the response
 * is `{ enabled: false }` and nothing else. DEMO_MODE cannot be enabled in
 * production at all — see env.ts.
 */
demoRoute.get("/", (c) => {
  if (!env.DEMO_MODE) {
    return c.json({ enabled: false as const });
  }

  return c.json({
    enabled: true as const,
    otp: DEMO_OTP,
    accounts: DEMO_ACCOUNTS.map(({ email, name, role, headline }) => ({
      email,
      name,
      role,
      headline,
    })),
  });
});
