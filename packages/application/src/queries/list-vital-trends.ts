import type { VitalSign, VitalSignRepository } from "../ports.js";

export async function listVitalTrends(
  patientId: string,
  deps: { vitalSigns: VitalSignRepository },
): Promise<VitalSign[]> {
  return deps.vitalSigns.listByPatientId(patientId);
}
