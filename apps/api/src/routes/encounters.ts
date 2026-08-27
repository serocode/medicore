import {
  PatientNotFoundError,
  StaffProfileNotFoundError,
  getStaffProfileByUserId,
  listPatientTimeline,
  listVitalTrends,
  recordEncounter,
} from "@healthcare/application";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireStaff } from "../middleware/require-staff.js";
import {
  doctorRepository,
  encounterRepository,
  nurseRepository,
  patientRepository,
  vitalSignRepository,
} from "../repos.js";

export const encountersRoute = new Hono<{ Variables: AuthVariables }>();

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);
function optionalRange(min: number, max: number, label: string) {
  return z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce
      .number()
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

function optionalIntRange(min: number, max: number, label: string) {
  return z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce
      .number()
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

const vitalsSchema = z.object({
  bpSystolic: optionalIntRange(40, 260, "Systolic blood pressure"),
  bpDiastolic: optionalIntRange(20, 200, "Diastolic blood pressure"),
  heartRate: optionalIntRange(20, 300, "Heart rate"),
  respiratoryRate: optionalIntRange(4, 60, "Respiratory rate"),
  temperatureCelsius: optionalRange(25, 45, "Temperature"),
  oxygenSaturation: optionalIntRange(0, 100, "Oxygen saturation"),
  weightKg: optionalRange(0.5, 500, "Weight"),
  heightCm: optionalRange(20, 300, "Height"),
  notes: optionalText,
});

const encounterSchema = z.object({
  encounterType: z.enum(["consultation", "follow_up", "nursing_check", "vitals_only", "other"]),
  chiefComplaint: optionalText,
  subjective: optionalText,
  objectiveFindings: optionalText,
  assessment: optionalText,
  diagnosis: optionalText,
  plan: optionalText,
  recommendations: optionalText,
  followUpInstructions: optionalText,
  additionalNotes: optionalText,
  vitals: vitalsSchema.optional(),
});

encountersRoute.post("/:patientId/encounters", requireAuth, requireStaff, async (c) => {
  const user = c.get("user");
  const patientId = c.req.param("patientId");

  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const staffProfile = await getStaffProfileByUserId(user.id, user.role as "doctor" | "nurse", {
    doctors: doctorRepository,
    nurses: nurseRepository,
  });
  if (!staffProfile) {
    throw new StaffProfileNotFoundError();
  }
  const recordedByName =
    staffProfile.role === "doctor"
      ? (staffProfile.doctor?.name ?? "")
      : (staffProfile.nurse?.name ?? "");

  const input = encounterSchema.parse(await c.req.json());

  const result = await recordEncounter(
    {
      encounter: {
        patientId,
        recordedByUserId: user.id,
        recordedByName,
        recordedByRole: staffProfile.role,
        encounterType: input.encounterType,
        chiefComplaint: input.chiefComplaint ?? null,
        subjective: input.subjective ?? null,
        objectiveFindings: input.objectiveFindings ?? null,
        assessment: input.assessment ?? null,
        diagnosis: input.diagnosis ?? null,
        plan: input.plan ?? null,
        recommendations: input.recommendations ?? null,
        followUpInstructions: input.followUpInstructions ?? null,
        additionalNotes: input.additionalNotes ?? null,
      },
      vitals: input.vitals
        ? {
            bpSystolic: input.vitals.bpSystolic ?? null,
            bpDiastolic: input.vitals.bpDiastolic ?? null,
            heartRate: input.vitals.heartRate ?? null,
            respiratoryRate: input.vitals.respiratoryRate ?? null,
            temperatureCelsius: input.vitals.temperatureCelsius ?? null,
            oxygenSaturation: input.vitals.oxygenSaturation ?? null,
            weightKg: input.vitals.weightKg ?? null,
            heightCm: input.vitals.heightCm ?? null,
            notes: input.vitals.notes ?? null,
          }
        : undefined,
    },
    { encounters: encounterRepository, vitalSigns: vitalSignRepository },
  );

  return c.json(result, 201);
});

encountersRoute.get("/:patientId/encounters", requireAuth, requireStaff, async (c) => {
  const patientId = c.req.param("patientId");
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const encounters = await listPatientTimeline(patientId, { encounters: encounterRepository });
  return c.json({ encounters });
});

encountersRoute.get("/:patientId/vitals", requireAuth, requireStaff, async (c) => {
  const patientId = c.req.param("patientId");
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const vitals = await listVitalTrends(patientId, { vitalSigns: vitalSignRepository });
  return c.json({ vitals });
});
