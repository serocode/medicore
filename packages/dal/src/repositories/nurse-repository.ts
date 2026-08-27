import type { NewNurse, Nurse, NurseRepository } from "@healthcare/application";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { nurse } from "../schema/nurse.js";

function toNurse(row: typeof nurse.$inferSelect): Nurse {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    title: row.title,
    department: row.department,
    licenseNumber: row.licenseNumber,
    contactPhone: row.contactPhone,
    bio: row.bio,
    imageUrl: row.imageUrl,
  };
}

export class DrizzleNurseRepository implements NurseRepository {
  constructor(private db: Db) {}

  async create(input: NewNurse): Promise<Nurse> {
    const [row] = await this.db.insert(nurse).values(input).returning();
    if (!row) throw new Error("Failed to create nurse");
    return toNurse(row);
  }

  async update(input: Nurse): Promise<Nurse> {
    const [row] = await this.db
      .update(nurse)
      .set({
        name: input.name,
        title: input.title,
        department: input.department,
        licenseNumber: input.licenseNumber,
        contactPhone: input.contactPhone,
        bio: input.bio,
        imageUrl: input.imageUrl,
      })
      .where(eq(nurse.id, input.id))
      .returning();
    if (!row) throw new Error("Failed to update nurse");
    return toNurse(row);
  }

  async findByUserId(userId: string): Promise<Nurse | null> {
    const [row] = await this.db.select().from(nurse).where(eq(nurse.userId, userId));
    return row ? toNurse(row) : null;
  }

  async findById(id: string): Promise<Nurse | null> {
    const [row] = await this.db.select().from(nurse).where(eq(nurse.id, id));
    return row ? toNurse(row) : null;
  }

  async list(): Promise<Nurse[]> {
    const rows = await this.db.select().from(nurse);
    return rows.map(toNurse);
  }
}
