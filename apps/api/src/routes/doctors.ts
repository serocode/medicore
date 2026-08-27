import { listDoctors } from "@healthcare/application";
import { Hono } from "hono";
import { requireAuth } from "../middleware/require-auth.js";
import { doctorRepository } from "../repos.js";

export const doctorsRoute = new Hono();

doctorsRoute.get("/", requireAuth, async (c) => {
  const doctors = await listDoctors({ doctors: doctorRepository });
  return c.json({ doctors });
});
