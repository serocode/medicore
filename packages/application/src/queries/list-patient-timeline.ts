import type { Encounter, EncounterRepository } from "../ports.js";

export async function listPatientTimeline(
  patientId: string,
  deps: { encounters: EncounterRepository },
): Promise<Encounter[]> {
  return deps.encounters.listByPatientId(patientId);
}
