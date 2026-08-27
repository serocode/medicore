import {
  StaffProfileNotFoundError,
  getStaffProfileByUserId,
  updateDoctorProfile,
  updateNurseProfile,
} from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireStaff } from "../middleware/require-staff.js";
import { doctorRepository, nurseRepository } from "../repos.js";

export const staffRoute = new Hono<{ Variables: AuthVariables }>();

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const doctorProfileSchema = z.object({
  name: z.string().min(1),
  specialization: z.string().min(1),
  title: optionalText,
  department: optionalText,
  licenseNumber: optionalText,
  contactPhone: optionalText,
  bio: optionalText,
  yearsOfExperience: z.coerce.number().int().nonnegative().optional(),
});

const nurseProfileSchema = z.object({
  name: z.string().min(1),
  title: optionalText,
  department: optionalText,
  licenseNumber: optionalText,
  contactPhone: optionalText,
  bio: optionalText,
});

staffRoute.get("/me", requireAuth, requireStaff, async (c) => {
  const user = c.get("user");
  const profile = await getStaffProfileByUserId(user.id, {
    doctors: doctorRepository,
    nurses: nurseRepository,
  });
  if (!profile) {
    throw new StaffProfileNotFoundError();
  }
  return c.json(profile);
});

staffRoute.patch("/me", requireAuth, requireStaff, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  if (user.role === "doctor") {
    const existing = await doctorRepository.findByUserId(user.id);
    if (!existing) throw new StaffProfileNotFoundError();

    const input = doctorProfileSchema.parse(body);
    const doctor = await updateDoctorProfile(
      {
        ...existing,
        name: input.name,
        specialization: input.specialization,
        title: input.title ?? null,
        department: input.department ?? null,
        licenseNumber: input.licenseNumber ?? null,
        contactPhone: input.contactPhone ?? null,
        bio: input.bio ?? null,
        yearsOfExperience: input.yearsOfExperience ?? null,
      },
      { doctors: doctorRepository },
    );
    return c.json({ role: "doctor", doctor });
  }

  const existing = await nurseRepository.findByUserId(user.id);
  if (!existing) throw new StaffProfileNotFoundError();

  const input = nurseProfileSchema.parse(body);
  const nurse = await updateNurseProfile(
    {
      ...existing,
      name: input.name,
      title: input.title ?? null,
      department: input.department ?? null,
      licenseNumber: input.licenseNumber ?? null,
      contactPhone: input.contactPhone ?? null,
      bio: input.bio ?? null,
    },
    { nurses: nurseRepository },
  );
  return c.json({ role: "nurse", nurse });
});
