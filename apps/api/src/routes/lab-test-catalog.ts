import { listLabTestCatalog } from "@healthcare/application";
import { Hono } from "hono";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireStaff } from "../middleware/require-staff.js";
import { labTestCatalogRepository } from "../repos.js";

export const labTestCatalogRoute = new Hono<{ Variables: AuthVariables }>();

labTestCatalogRoute.get("/", requireAuth, requireStaff, async (c) => {
  const catalog = await listLabTestCatalog({ catalog: labTestCatalogRepository });
  return c.json({ catalog });
});
