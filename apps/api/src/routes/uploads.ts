import { getPatientByUserId } from "@healthcare/application";
import { Hono } from "hono";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { accountProfileRepository, labResultRepository, patientRepository } from "../repos.js";

export const uploadsRoute = new Hono<{ Variables: AuthVariables }>();

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

uploadsRoute.get("/:key", requireAuth, async (c) => {
  const user = c.get("user");
  const key = c.req.param("key");

  // Everyone can read their own profile picture, whatever their role — it is
  // their own file and the nav bar renders it on every page.
  const account = await accountProfileRepository.findById(user.id);
  if (account?.imagePath === key) {
    const ownBuffer = await fileStorage.read(key);
    const ownExtension = key.slice(key.lastIndexOf("."));
    return new Response(new Uint8Array(ownBuffer), {
      headers: {
        "Content-Type": CONTENT_TYPE_BY_EXTENSION[ownExtension] ?? "application/octet-stream",
      },
    });
  }

  if (user.role === "doctor" || user.role === "nurse") {
    // Unscoped, matching their existing unscoped access to encounters/vitals.
  } else if (user.role !== "admin") {
    const patient = await getPatientByUserId(user.id, { patients: patientRepository });
    const ownsIdDocument = patient?.identificationDocumentPath === key;
    const ownsLabResultFile = patient
      ? (await labResultRepository.findPatientIdByReportFilePath(key)) === patient.id
      : false;
    if (!ownsIdDocument && !ownsLabResultFile) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  const buffer = await fileStorage.read(key);
  const extension = key.slice(key.lastIndexOf("."));
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": contentType } });
});
