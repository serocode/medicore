import { LabTestCatalogItemNotFoundError } from "../errors.js";
import type {
  LabResult,
  LabResultRepository,
  LabTestCatalogRepository,
  StaffRole,
} from "../ports.js";

export interface RequestLabTestInput {
  patientId: string;
  encounterId?: string | null;
  catalogItemId: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedByRole: StaffRole;
  requestNotes?: string | null;
}

export interface RequestLabTestDeps {
  labResults: LabResultRepository;
  catalog: LabTestCatalogRepository;
}

// No role restriction beyond being staff — both doctors and nurses can
// request a test, per the spec's permission table.
export async function requestLabTest(
  input: RequestLabTestInput,
  deps: RequestLabTestDeps,
): Promise<LabResult> {
  const catalogItem = await deps.catalog.findById(input.catalogItemId);
  if (!catalogItem || !catalogItem.isActive) {
    throw new LabTestCatalogItemNotFoundError();
  }

  return deps.labResults.create({
    patientId: input.patientId,
    encounterId: input.encounterId ?? null,
    catalogItemId: catalogItem.id,
    // Snapshotted from the catalog at request time so renaming/reclassifying
    // it later doesn't rewrite this request's history.
    testName: catalogItem.name,
    category: catalogItem.category,
    requestedByUserId: input.requestedByUserId,
    requestedByName: input.requestedByName,
    requestedByRole: input.requestedByRole,
    requestNotes: input.requestNotes ?? null,
    datePerformed: null,
    dateReleased: null,
    facility: null,
    findings: null,
    summary: null,
    interpretation: null,
    remarks: null,
    uploadedByUserId: null,
    uploadedByName: null,
    uploadedByRole: null,
    uploadedAt: null,
    reviewedByUserId: null,
    reviewedByName: null,
    reviewInterpretation: null,
    reviewNotes: null,
    followUpRecommendation: null,
    actionTaken: null,
    cancellationReason: null,
  });
}
