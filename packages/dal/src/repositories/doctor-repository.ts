import type { Doctor, DoctorRepository } from "@healthcare/application";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { doctor } from "../schema/doctor.js";

function toDoctor(row: typeof doctor.$inferSelect): Doctor {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization,
    imageUrl: row.imageUrl,
  };
}

export class DrizzleDoctorRepository implements DoctorRepository {
  constructor(private db: Db) {}

  async list(): Promise<Doctor[]> {
    const rows = await this.db.select().from(doctor);
    return rows.map(toDoctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    const [row] = await this.db.select().from(doctor).where(eq(doctor.id, id));
    return row ? toDoctor(row) : null;
  }
}
