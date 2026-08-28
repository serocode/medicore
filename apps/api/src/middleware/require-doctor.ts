import { createMiddleware } from "hono/factory";
import type { AuthVariables } from "./require-auth.js";

/**
 * Signing off a laboratory result is a doctor's clinical judgement, and the
 * result is final once it happens. The UI has always hidden the control from
 * nursing staff, but hiding a button is not authorization — this makes the
 * restriction real.
 */
export const requireDoctor = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "doctor") {
    return c.json({ error: "Only a doctor can complete this action" }, 403);
  }

  await next();
});
