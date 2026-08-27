import {
  type LabResult,
  LabResultConcurrentUpdateError,
  type LabResultParameter,
  type LabResultRepository,
  type LabResultWithPatientName,
  type NewLabResult,
  type NewLabResultParameter,
} from "@healthcare/application";
import type { LabResultStatus } from "@healthcare/domain";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../client.js";
import { user } from "../schema/auth.js";
import { labResult, labResultParameter } from "../schema/laboratory.js";
import { patient } from "../schema/patient.js";

function toLabResult(row: typeof labResult.$inferSelect): LabResult {
  return {
    id: row.id,
    patientId: row.patientId,
    encounterId: row.encounterId,
    catalogItemId: row.catalogItemId,
    testName: row.testName,
    category: row.category,
    status: row.status,
    requestedByUserId: row.requestedByUserId,
    requestedByName: row.requestedByName,
    requestedByRole: row.requestedByRole,
    requestNotes: row.requestNotes,
    requestedAt: row.requestedAt,
    datePerformed: row.datePerformed,
    dateReleased: row.dateReleased,
    facility: row.facility,
    findings: row.findings,
    summary: row.summary,
    interpretation: row.interpretation,
    remarks: row.remarks,
    reportFilePath: row.reportFilePath,
    uploadedByUserId: row.uploadedByUserId,
    uploadedByName: row.uploadedByName,
    uploadedByRole: row.uploadedByRole,
    uploadedAt: row.uploadedAt,
    reviewedByUserId: row.reviewedByUserId,
    reviewedByName: row.reviewedByName,
    reviewedAt: row.reviewedAt,
    reviewInterpretation: row.reviewInterpretation,
    reviewNotes: row.reviewNotes,
    followUpRecommendation: row.followUpRecommendation,
    actionTaken: row.actionTaken,
    cancellationReason: row.cancellationReason,
  };
}

function toLabResultParameter(row: typeof labResultParameter.$inferSelect): LabResultParameter {
  return {
    id: row.id,
    labResultId: row.labResultId,
    parameterName: row.parameterName,
    value: row.value,
    unit: row.unit,
    referenceRange: row.referenceRange,
    flag: row.flag,
    remarks: row.remarks,
    sortOrder: row.sortOrder,
  };
}

export class DrizzleLabResultRepository implements LabResultRepository {
  constructor(private db: Db) {}

  async create(input: NewLabResult): Promise<LabResult> {
    const [row] = await this.db.insert(labResult).values(input).returning();
    if (!row) throw new Error("Failed to create laboratory result");
    return toLabResult(row);
  }

  async findById(id: string): Promise<LabResult | null> {
    const [row] = await this.db.select().from(labResult).where(eq(labResult.id, id));
    return row ? toLabResult(row) : null;
  }

  async listByPatientId(patientId: string): Promise<LabResult[]> {
    const rows = await this.db
      .select()
      .from(labResult)
      .where(eq(labResult.patientId, patientId))
      .orderBy(desc(labResult.requestedAt));
    return rows.map(toLabResult);
  }

  async listAll(statuses?: LabResultStatus[]): Promise<LabResult[]> {
    const rows =
      statuses && statuses.length > 0
        ? await this.db
            .select()
            .from(labResult)
            .where(inArray(labResult.status, statuses))
            .orderBy(desc(labResult.requestedAt))
        : await this.db.select().from(labResult).orderBy(desc(labResult.requestedAt));
    return rows.map(toLabResult);
  }

  // patientId is a non-nullable FK, so this left join always matches in
  // practice; the `?? ""` fallback only satisfies Drizzle's join-nullability
  // typing (same rationale as AppointmentWithDetails).
  async listAllWithPatientName(statuses?: LabResultStatus[]): Promise<LabResultWithPatientName[]> {
    const query = this.db
      .select({ labResult, patientName: user.name })
      .from(labResult)
      .leftJoin(patient, eq(labResult.patientId, patient.id))
      .leftJoin(user, eq(patient.userId, user.id));

    const rows =
      statuses && statuses.length > 0
        ? await query
            .where(inArray(labResult.status, statuses))
            .orderBy(desc(labResult.requestedAt))
        : await query.orderBy(desc(labResult.requestedAt));

    return rows.map((row) => ({
      ...toLabResult(row.labResult),
      patientName: row.patientName ?? "",
    }));
  }

  async update(input: LabResult, expectedStatus: LabResultStatus): Promise<LabResult> {
    const [row] = await this.db
      .update(labResult)
      .set({
        status: input.status,
        datePerformed: input.datePerformed,
        dateReleased: input.dateReleased,
        facility: input.facility,
        findings: input.findings,
        summary: input.summary,
        interpretation: input.interpretation,
        remarks: input.remarks,
        reportFilePath: input.reportFilePath,
        uploadedByUserId: input.uploadedByUserId,
        uploadedByName: input.uploadedByName,
        uploadedByRole: input.uploadedByRole,
        uploadedAt: input.uploadedAt,
        reviewedByUserId: input.reviewedByUserId,
        reviewedByName: input.reviewedByName,
        reviewedAt: input.reviewedAt,
        reviewInterpretation: input.reviewInterpretation,
        reviewNotes: input.reviewNotes,
        followUpRecommendation: input.followUpRecommendation,
        actionTaken: input.actionTaken,
        cancellationReason: input.cancellationReason,
        updatedAt: new Date(),
      })
      .where(and(eq(labResult.id, input.id), eq(labResult.status, expectedStatus)))
      .returning();
    if (!row) {
      // Either the id doesn't exist, or it does but its status has already
      // moved on since the caller read it — the caller can't tell which
      // without another lookup, so treat both as a concurrent-update conflict.
      throw new LabResultConcurrentUpdateError();
    }
    return toLabResult(row);
  }

  async listParametersByLabResultId(labResultId: string): Promise<LabResultParameter[]> {
    const rows = await this.db
      .select()
      .from(labResultParameter)
      .where(eq(labResultParameter.labResultId, labResultId))
      .orderBy(labResultParameter.sortOrder);
    return rows.map(toLabResultParameter);
  }

  // Wrapped in a transaction — a half-replaced parameter set on crash would
  // silently corrupt a result, which matters more here than elsewhere in
  // the DAL since these are the numbers a clinician acts on.
  async replaceParameters(
    labResultId: string,
    parameters: NewLabResultParameter[],
  ): Promise<LabResultParameter[]> {
    return this.db.transaction(async (tx) => {
      await tx.delete(labResultParameter).where(eq(labResultParameter.labResultId, labResultId));
      if (parameters.length === 0) return [];
      const rows = await tx
        .insert(labResultParameter)
        .values(parameters.map((parameter) => ({ ...parameter, labResultId })))
        .returning();
      return rows.map(toLabResultParameter);
    });
  }

  async findPatientIdByReportFilePath(storageKey: string): Promise<string | null> {
    const [row] = await this.db
      .select({ patientId: labResult.patientId })
      .from(labResult)
      .where(eq(labResult.reportFilePath, storageKey));
    return row?.patientId ?? null;
  }
}
