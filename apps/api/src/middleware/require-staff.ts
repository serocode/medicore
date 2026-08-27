import { createMiddleware } from "hono/factory";
import type { AuthVariables } from "./require-auth.js";

export const requireStaff = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "doctor" && user.role !== "nurse") {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});
