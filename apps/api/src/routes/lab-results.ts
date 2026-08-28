import {
  LabResultNotFoundError,
  PatientNotFoundError,
  StaffProfileNotFoundError,
  cancelLabRequest,
  getLabResultDetail,
  getStaffProfileByUserId,
  listLabResultsByStatus,
  listLabResultsForPatient,
  requestLabTest,
  reviewLabResult,
  sendLabRequest,
  uploadLabResult,
} from "@healthcare/application";
import { InvalidLabResultTransitionError, type LabResultStatus } from "@healthcare/domain";
import { Hono } from "hono";
import { z } from "zod";
import { fileStorage } from "../lib/storage.js";
import type { AuthVariables } from "../middleware/require-auth.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireDoctor } from "../middleware/require-doctor.js";
import { requireStaff } from "../middleware/require-staff.js";
import {
  doctorRepository,
  encounterRepository,
  labResultRepository,
  labTestCatalogRepository,
  nurseRepository,
  patientRepository,
} from "../repos.js";

// Patient-nested routes (mounted on /api/patients), matching encounters.ts's
// convention.
export const labResultsRoute = new Hono<{ Variables: AuthVariables }>();

/**
 * Loads a lab result and proves it belongs to the patient in the path.
 *
 * Every result route needs this pairing, and it was open-coded in four
 * places. Throwing LabResultNotFoundError rather than a 403 is deliberate:
 * a distinguishable "exists but not yours" would let a caller enumerate
 * other patients' result ids by guessing UUIDs under their own prefix.
 */
async function loadOwnedLabResult(patientId: string, labResultId: string) {
  const detail = await getLabResultDetail(labResultId, { labResults: labResultRepository });
  if (detail.labResult.patientId !== patientId) {
    throw new LabResultNotFoundError();
  }
  return detail;
}

// Cross-patient routes (mounted on /api/lab-results) — the dashboard
// widgets need to list across patients by status, not within one patient.
export const labResultsDashboardRoute = new Hono<{ Variables: AuthVariables }>();

const LAB_RESULT_STATUSES: LabResultStatus[] = [
  "requested",
  "pending",
  "result_available",
  "reviewed",
  "cancelled",
];

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional(),
);

async function resolveStaffIdentity(userId: string, role: "doctor" | "nurse") {
  const staffProfile = await getStaffProfileByUserId(userId, role, {
    doctors: doctorRepository,
    nurses: nurseRepository,
  });
  if (!staffProfile) {
    throw new StaffProfileNotFoundError();
  }
  const name =
    staffProfile.role === "doctor"
      ? (staffProfile.doctor?.name ?? "")
      : (staffProfile.nurse?.name ?? "");
  return { role: staffProfile.role, name };
}

const requestLabTestSchema = z.object({
  catalogItemId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  requestNotes: optionalText,
});

labResultsRoute.post("/:patientId/lab-results", requireAuth, requireStaff, async (c) => {
  const user = c.get("user");
  const patientId = c.req.param("patientId");

  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const staff = await resolveStaffIdentity(user.id, user.role as "doctor" | "nurse");
  const input = requestLabTestSchema.parse(await c.req.json());

  if (input.encounterId) {
    const encounters = await encounterRepository.listByPatientId(patientId);
    if (!encounters.some((encounter) => encounter.id === input.encounterId)) {
      return c.json({ error: "encounterId does not belong to this patient" }, 400);
    }
  }

  const labResult = await requestLabTest(
    {
      patientId,
      encounterId: input.encounterId ?? null,
      catalogItemId: input.catalogItemId,
      requestedByUserId: user.id,
      requestedByName: staff.name,
      requestedByRole: staff.role,
      requestNotes: input.requestNotes ?? null,
    },
    { labResults: labResultRepository, catalog: labTestCatalogRepository },
  );

  return c.json({ labResult }, 201);
});

labResultsRoute.get("/:patientId/lab-results", requireAuth, requireStaff, async (c) => {
  const patientId = c.req.param("patientId");
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError();
  }

  const labResults = await listLabResultsForPatient(patientId, { labResults: labResultRepository });
  return c.json({ labResults });
});

labResultsRoute.get(
  "/:patientId/lab-results/:labResultId",
  requireAuth,
  requireStaff,
  async (c) => {
    const patientId = c.req.param("patientId");
    const labResultId = c.req.param("labResultId");

    const detail = await loadOwnedLabResult(patientId, labResultId);

    return c.json(detail);
  },
);

const parameterSchema = z.object({
  parameterName: z.string().min(1),
  value: z.string().min(1),
  unit: optionalText,
  referenceRange: optionalText,
  flag: z.enum(["normal", "abnormal", "critical"]).optional(),
  remarks: optionalText,
});

const uploadResultSchema = z.object({
  datePerformed: optionalDate,
  dateReleased: optionalDate,
  facility: optionalText,
  findings: optionalText,
  summary: optionalText,
  interpretation: optionalText,
  remarks: optionalText,
  parameters: z.preprocess((value) => {
    if (typeof value !== "string" || value === "") return [];
    return JSON.parse(value);
  }, z.array(parameterSchema)),
});

labResultsRoute.post(
  "/:patientId/lab-results/:labResultId/result",
  requireAuth,
  requireStaff,
  async (c) => {
    const user = c.get("user");
    const patientId = c.req.param("patientId");
    const labResultId = c.req.param("labResultId");

    const existing = await loadOwnedLabResult(patientId, labResultId);
    // Fail before touching the filesystem: a result that's already cancelled
    // or reviewed can never legally receive an upload, so there's no reason
    // to write a file that would just end up orphaned.
    if (existing.labResult.status === "cancelled" || existing.labResult.status === "reviewed") {
      throw new InvalidLabResultTransitionError(existing.labResult.status, "result_available");
    }

    const staff = await resolveStaffIdentity(user.id, user.role as "doctor" | "nurse");
    const body = await c.req.parseBody();

    const reportFile = body.reportFile;
    if (!(reportFile instanceof File)) {
      return c.json({ error: "reportFile is required" }, 400);
    }

    // Validate the rest of the body before writing the file to disk, so a
    // malformed request never leaves an orphaned upload behind either.
    const input = uploadResultSchema.parse(body);
    const storageKey = await fileStorage.save(reportFile);

    const result = await uploadLabResult(
      {
        labResultId,
        datePerformed: input.datePerformed ?? null,
        dateReleased: input.dateReleased ?? null,
        facility: input.facility ?? null,
        findings: input.findings ?? null,
        summary: input.summary ?? null,
        interpretation: input.interpretation ?? null,
        remarks: input.remarks ?? null,
        reportFilePath: storageKey,
        uploadedByUserId: user.id,
        uploadedByName: staff.name,
        uploadedByRole: staff.role,
        parameters: input.parameters.map((parameter, index) => ({
          parameterName: parameter.parameterName,
          value: parameter.value,
          unit: parameter.unit ?? null,
          referenceRange: parameter.referenceRange ?? null,
          flag: parameter.flag ?? null,
          remarks: parameter.remarks ?? null,
          sortOrder: index,
        })),
      },
      { labResults: labResultRepository },
    );

    return c.json(result);
  },
);

const reviewSchema = z.object({
  reviewInterpretation: z.string().min(1, "A clinical interpretation is required"),
  reviewNotes: optionalText,
  followUpRecommendation: optionalText,
  actionTaken: optionalText,
});

labResultsRoute.patch(
  "/:patientId/lab-results/:labResultId/review",
  requireAuth,
  requireStaff,
  requireDoctor,
  async (c) => {
    const user = c.get("user");
    const patientId = c.req.param("patientId");
    const labResultId = c.req.param("labResultId");

    const existing = await loadOwnedLabResult(patientId, labResultId);

    const staff = await resolveStaffIdentity(user.id, "doctor");
    const input = reviewSchema.parse(await c.req.json());

    const labResult = await reviewLabResult(
      {
        labResultId,
        reviewedByUserId: user.id,
        reviewedByName: staff.name,
        reviewedByRole: staff.role,
        reviewInterpretation: input.reviewInterpretation,
        reviewNotes: input.reviewNotes ?? null,
        followUpRecommendation: input.followUpRecommendation ?? null,
        actionTaken: input.actionTaken ?? null,
      },
      { labResults: labResultRepository },
    );

    return c.json({ labResult });
  },
);

const cancelSchema = z.object({ reason: z.string().min(1) });

labResultsRoute.patch(
  "/:patientId/lab-results/:labResultId/cancel",
  requireAuth,
  requireStaff,
  async (c) => {
    const patientId = c.req.param("patientId");
    const labResultId = c.req.param("labResultId");

    const existing = await loadOwnedLabResult(patientId, labResultId);

    const input = cancelSchema.parse(await c.req.json());

    const labResult = await cancelLabRequest(
      { labResultId, reason: input.reason },
      { labResults: labResultRepository },
    );

    return c.json({ labResult });
  },
);

labResultsRoute.patch(
  "/:patientId/lab-results/:labResultId/send-to-laboratory",
  requireAuth,
  requireStaff,
  async (c) => {
    const patientId = c.req.param("patientId");
    const labResultId = c.req.param("labResultId");

    await loadOwnedLabResult(patientId, labResultId);

    const labResult = await sendLabRequest({ labResultId }, { labResults: labResultRepository });

    return c.json({ labResult });
  },
);

labResultsDashboardRoute.get("/", requireAuth, requireStaff, async (c) => {
  const requested = c.req.queries("status") ?? [];
  const statuses = requested.filter((s): s is LabResultStatus =>
    LAB_RESULT_STATUSES.includes(s as LabResultStatus),
  );

  const labResults = await listLabResultsByStatus(statuses.length > 0 ? statuses : undefined, {
    labResults: labResultRepository,
  });
  return c.json({ labResults });
});
