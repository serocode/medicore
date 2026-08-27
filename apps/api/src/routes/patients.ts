import { getPatientByUserId, registerPatient } from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { patientRepository } from "../repos.js";

export const patientsRoute = new Hono<{ Variables: AuthVariables }>();

const booleanFromString = z.preprocess((value) => value === "true" || value === true, z.boolean());
const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const registerPatientSchema = z.object({
  birthDate: z.string().min(1),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(1),
  occupation: z.string().min(1),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
  primaryPhysicianId: z.string().uuid(),
  insuranceProvider: optionalText,
  insurancePolicyNumber: optionalText,
  allergies: optionalText,
  currentMedications: optionalText,
  familyMedicalHistory: optionalText,
  pastMedicalHistory: optionalText,
  consentTreatment: booleanFromString,
  consentDisclosure: booleanFromString,
  consentPrivacy: booleanFromString,
});

patientsRoute.post("/register", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const idDocument = body.identificationDocument;
  if (!(idDocument instanceof File)) {
    return c.json({ error: "identificationDocument file is required" }, 400);
  }

  const input = registerPatientSchema.parse(body);
  const storageKey = await fileStorage.save(idDocument);

  const patient = await registerPatient(
    {
      userId: user.id,
      birthDate: input.birthDate,
      gender: input.gender,
      address: input.address,
      occupation: input.occupation,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      primaryPhysicianId: input.primaryPhysicianId,
      insuranceProvider: input.insuranceProvider ?? null,
      insurancePolicyNumber: input.insurancePolicyNumber ?? null,
      allergies: input.allergies ?? null,
      currentMedications: input.currentMedications ?? null,
      familyMedicalHistory: input.familyMedicalHistory ?? null,
      pastMedicalHistory: input.pastMedicalHistory ?? null,
      identificationDocumentPath: storageKey,
      consentTreatment: input.consentTreatment,
      consentDisclosure: input.consentDisclosure,
      consentPrivacy: input.consentPrivacy,
    },
    { patients: patientRepository },
  );

  return c.json({ patient }, 201);
});

patientsRoute.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const patient = await getPatientByUserId(user.id, { patients: patientRepository });
  if (!patient) {
    return c.json({ error: "Patient not found" }, 404);
  }
  return c.json({ patient });
});
