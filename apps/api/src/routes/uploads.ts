import { getPatientByUserId } from "@healthcare/application";
import { Hono } from "hono";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { patientRepository } from "../repos.js";

export const uploadsRoute = new Hono<{ Variables: AuthVariables }>();

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

uploadsRoute.get("/:key", requireAuth, async (c) => {
  const user = c.get("user");
  const key = c.req.param("key");

  if (user.role !== "admin") {
    const patient = await getPatientByUserId(user.id, { patients: patientRepository });
    if (!patient || patient.identificationDocumentPath !== key) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  const buffer = await fileStorage.read(key);
  const extension = key.slice(key.lastIndexOf("."));
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": contentType } });
});
