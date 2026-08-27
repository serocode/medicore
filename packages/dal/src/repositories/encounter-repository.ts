import type { Encounter, EncounterRepository, NewEncounter } from "@healthcare/application";
import { desc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { encounter } from "../schema/encounter.js";

function toEncounter(row: typeof encounter.$inferSelect): Encounter {
  return {
    id: row.id,
    patientId: row.patientId,
    recordedByUserId: row.recordedByUserId,
    recordedByName: row.recordedByName,
    recordedByRole: row.recordedByRole,
    encounterType: row.encounterType,
    chiefComplaint: row.chiefComplaint,
    subjective: row.subjective,
    objectiveFindings: row.objectiveFindings,
    assessment: row.assessment,
    diagnosis: row.diagnosis,
    plan: row.plan,
    recommendations: row.recommendations,
    followUpInstructions: row.followUpInstructions,
    additionalNotes: row.additionalNotes,
    occurredAt: row.occurredAt,
  };
}

export class DrizzleEncounterRepository implements EncounterRepository {
  constructor(private db: Db) {}

  async create(input: NewEncounter): Promise<Encounter> {
    const [row] = await this.db.insert(encounter).values(input).returning();
    if (!row) throw new Error("Failed to create encounter");
    return toEncounter(row);
  }

  async listByPatientId(patientId: string): Promise<Encounter[]> {
    const rows = await this.db
      .select()
      .from(encounter)
      .where(eq(encounter.patientId, patientId))
      .orderBy(desc(encounter.occurredAt));
    return rows.map(toEncounter);
  }
}
