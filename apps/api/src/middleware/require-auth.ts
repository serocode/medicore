import { createMiddleware } from "hono/factory";
import { auth } from "../auth.js";

export interface AuthedUser {
  id: string;
  email: string;
  role: string;
}

export type AuthVariables = {
  user: AuthedUser;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    role: (session.user as { role?: string }).role ?? "patient",
  });

  await next();
});
