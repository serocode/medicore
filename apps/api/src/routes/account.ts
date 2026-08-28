import { getAccountProfile, updateAccountImage, updateAccountName } from "@healthcare/application";
import { NAME_SUFFIXES } from "@healthcare/domain";
import { Hono } from "hono";
import { z } from "zod";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { accountProfileRepository } from "../repos.js";

/**
 * The signed-in person's own account: their name and profile picture.
 *
 * Every route here is scoped to `c.get("user").id` and takes no user id from
 * the caller, so there is nothing to authorize beyond being signed in — one
 * account can never reach another's.
 */
export const accountRoute = new Hono<{ Variables: AuthVariables }>();

const MAX_NAME_PART = 100;

const nameSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(MAX_NAME_PART),
  middleName: z.string().trim().max(MAX_NAME_PART).optional(),
  lastName: z.string().trim().min(1, "Surname is required").max(MAX_NAME_PART),
  // Constrained to the known list so "Jr" and "Jr." can't both end up stored.
  suffix: z.enum(NAME_SUFFIXES).optional(),
});

accountRoute.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const account = await getAccountProfile(user.id, { accounts: accountProfileRepository });
  return c.json({ account });
});

accountRoute.patch("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const input = nameSchema.parse(await c.req.json());

  const account = await updateAccountName(
    {
      userId: user.id,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      suffix: input.suffix ?? null,
    },
    { accounts: accountProfileRepository },
  );

  return c.json({ account });
});

accountRoute.post("/me/photo", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const photo = body.photo;
  if (!(photo instanceof File)) {
    return c.json({ error: "photo is required" }, 400);
  }
  // A profile picture is displayed inline, so a PDF — which fileStorage would
  // otherwise accept — is not a usable avatar.
  if (photo.type !== "image/jpeg" && photo.type !== "image/png") {
    return c.json({ error: "A profile picture must be a JPEG or PNG image" }, 400);
  }

  const storageKey = await fileStorage.save(photo);
  const account = await updateAccountImage(
    { userId: user.id, imagePath: storageKey },
    { accounts: accountProfileRepository },
  );

  return c.json({ account });
});

accountRoute.delete("/me/photo", requireAuth, async (c) => {
  const user = c.get("user");
  // The stored file is left on disk rather than deleted: the same key may
  // still be referenced by an older session's cached page, and orphaned
  // uploads are a storage concern, not a correctness one.
  const account = await updateAccountImage(
    { userId: user.id, imagePath: null },
    { accounts: accountProfileRepository },
  );
  return c.json({ account });
});
