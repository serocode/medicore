import { assertVitalSignsInRange, calculateBmi } from "@healthcare/domain";
import { StaffPermissionError } from "../errors.js";
import type {
  Encounter,
  EncounterRepository,
  NewEncounter,
  NewVitalSign,
  VitalSign,
  VitalSignRepository,
} from "../ports.js";

type VitalsInput = Omit<
  NewVitalSign,
  "encounterId" | "patientId" | "recordedByUserId" | "recordedByName" | "bmi"
>;

export interface RecordEncounterInput {
  encounter: NewEncounter;
  vitals?: VitalsInput;
}

export interface RecordEncounterDeps {
  encounters: EncounterRepository;
  vitalSigns: VitalSignRepository;
}

export interface RecordEncounterResult {
  encounter: Encounter;
  vitalSign: VitalSign | null;
}

export async function recordEncounter(
  input: RecordEncounterInput,
  deps: RecordEncounterDeps,
): Promise<RecordEncounterResult> {
  if (input.encounter.recordedByRole === "nurse" && input.encounter.diagnosis) {
    throw new StaffPermissionError("Nurses cannot record a diagnosis");
  }

  if (input.vitals) {
    assertVitalSignsInRange(input.vitals);
  }

  const encounter = await deps.encounters.create(input.encounter);

  let vitalSign: VitalSign | null = null;
  if (input.vitals) {
    vitalSign = await deps.vitalSigns.create({
      ...input.vitals,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      recordedByUserId: encounter.recordedByUserId,
      recordedByName: encounter.recordedByName,
      bmi: calculateBmi(input.vitals.weightKg, input.vitals.heightCm),
    });
  }

  return { encounter, vitalSign };
}
