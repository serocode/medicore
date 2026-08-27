import { createMiddleware } from "hono/factory";
import type { AuthVariables } from "./require-auth.js";

export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});
