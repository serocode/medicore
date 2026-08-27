import type { NewVitalSign, VitalSign, VitalSignRepository } from "@healthcare/application";
import { desc, eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { vitalSign } from "../schema/vital-sign.js";

function toVitalSign(row: typeof vitalSign.$inferSelect): VitalSign {
  return {
    id: row.id,
    encounterId: row.encounterId,
    patientId: row.patientId,
    recordedByUserId: row.recordedByUserId,
    recordedByName: row.recordedByName,
    bpSystolic: row.bpSystolic,
    bpDiastolic: row.bpDiastolic,
    heartRate: row.heartRate,
    respiratoryRate: row.respiratoryRate,
    temperatureCelsius: row.temperatureCelsius,
    oxygenSaturation: row.oxygenSaturation,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    bmi: row.bmi,
    notes: row.notes,
    recordedAt: row.recordedAt,
  };
}

export class DrizzleVitalSignRepository implements VitalSignRepository {
  constructor(private db: Db) {}

  async create(input: NewVitalSign): Promise<VitalSign> {
    const [row] = await this.db.insert(vitalSign).values(input).returning();
    if (!row) throw new Error("Failed to create vital sign");
    return toVitalSign(row);
  }

  async listByPatientId(patientId: string): Promise<VitalSign[]> {
    const rows = await this.db
      .select()
      .from(vitalSign)
      .where(eq(vitalSign.patientId, patientId))
      .orderBy(desc(vitalSign.recordedAt));
    return rows.map(toVitalSign);
  }
}
