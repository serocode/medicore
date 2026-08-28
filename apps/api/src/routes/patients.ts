import {
  PatientNotFoundError,
  deletePatientAccount,
  getPatientByUserId,
  getPatientContactInfo,
  listPatients,
  registerPatient,
  updatePatient,
} from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireStaff } from "../middleware/require-staff.js";
import { appointmentRepository, patientRepository } from "../repos.js";

export const patientsRoute = new Hono<{ Variables: AuthVariables }>();

// Staff-only: a clickable list to open a patient's clinical record from.
// Full search/filtering is a later phase — this is the whole active
// patient list for now.
patientsRoute.get("/", requireAuth, requireStaff, async (c) => {
  const patients = await listPatients({ patients: patientRepository });
  return c.json({ patients });
});

const booleanFromString = z.preprocess((value) => value === "true" || value === true, z.boolean());
const MAX_TEXT = 5000;
const MAX_LINE = 200;

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().max(MAX_TEXT, `Must be ${MAX_TEXT} characters or fewer`).optional(),
);

const notInTheFuture = (value: string) => new Date(value).getTime() <= Date.now();

// Deliberately permissive: international numbering, extensions, and local
// conventions vary far too much to pattern-match safely, and rejecting a
// real emergency contact is worse than accepting an odd-looking one. This
// only rules out input that could not be a phone number at all.
const looksLikePhone = (value: string) =>
  /^[+()\d][\d\s().+-]*(?:(?:ext|x|#)\.?\s*\d+)?$/i.test(value.trim()) &&
  (value.match(/\d/g)?.length ?? 0) >= 7;

const patientProfileSchema = z.object({
  birthDate: z.string().min(1).refine(notInTheFuture, "Date of birth cannot be in the future"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(1).max(MAX_LINE),
  occupation: z.string().min(1).max(MAX_LINE),
  emergencyContactName: z.string().min(1).max(MAX_LINE),
  emergencyContactPhone: z
    .string()
    .min(1)
    .max(40)
    .refine(looksLikePhone, "Enter a contactable phone number, including at least 7 digits"),
  primaryPhysicianId: z.string().uuid(),
  insuranceProvider: optionalText,
  insurancePolicyNumber: optionalText,
  allergies: optionalText,
  currentMedications: optionalText,
  familyMedicalHistory: optionalText,
  pastMedicalHistory: optionalText,
  identificationType: z.string().min(1).max(MAX_LINE),
  identificationNumber: z.string().min(1).max(MAX_LINE),
  bloodType: optionalText,
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

  const input = patientProfileSchema.parse(body);
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
      identificationType: input.identificationType,
      identificationNumber: input.identificationNumber,
      identificationDocumentPath: storageKey,
      bloodType: input.bloodType ?? null,
      consentTreatment: input.consentTreatment,
      consentDisclosure: input.consentDisclosure,
      consentPrivacy: input.consentPrivacy,
      deletedAt: null,
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

patientsRoute.patch("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const existing = await getPatientByUserId(user.id, { patients: patientRepository });
  if (!existing) {
    throw new PatientNotFoundError();
  }

  const body = await c.req.parseBody();
  const idDocument = body.identificationDocument;
  const storageKey =
    idDocument instanceof File
      ? await fileStorage.save(idDocument)
      : existing.identificationDocumentPath;

  const input = patientProfileSchema.parse(body);

  const patient = await updatePatient(
    {
      ...existing,
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
      identificationType: input.identificationType,
      identificationNumber: input.identificationNumber,
      identificationDocumentPath: storageKey,
      consentTreatment: input.consentTreatment,
      consentDisclosure: input.consentDisclosure,
      consentPrivacy: input.consentPrivacy,
    },
    { patients: patientRepository },
  );

  return c.json({ patient });
});

patientsRoute.delete("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const existing = await getPatientByUserId(user.id, { patients: patientRepository });
  if (!existing) {
    throw new PatientNotFoundError();
  }

  await deletePatientAccount(existing.id, {
    patients: patientRepository,
    appointments: appointmentRepository,
  });

  return c.body(null, 204);
});

// Staff-only: full patient detail for the clinical record page. Comes after
// the literal "/me" routes above — Hono resolves static segments ahead of
// param segments regardless of registration order, but keeping this last
// documents the intent.
patientsRoute.get("/:patientId", requireAuth, requireStaff, async (c) => {
  const patientId = c.req.param("patientId");
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }
  const contact = await getPatientContactInfo(patientId, { patients: patientRepository });
  return c.json({ patient, name: contact?.name ?? "", email: contact?.email ?? "" });
});
