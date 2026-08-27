import type { Doctor, DoctorRepository, NewDoctor } from "@healthcare/application";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { doctor } from "../schema/doctor.js";

function toDoctor(row: typeof doctor.$inferSelect): Doctor {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    specialization: row.specialization,
    imageUrl: row.imageUrl,
    title: row.title,
    department: row.department,
    licenseNumber: row.licenseNumber,
    contactPhone: row.contactPhone,
    bio: row.bio,
    yearsOfExperience: row.yearsOfExperience,
  };
}

export class DrizzleDoctorRepository implements DoctorRepository {
  constructor(private db: Db) {}

  async create(input: NewDoctor): Promise<Doctor> {
    const [row] = await this.db.insert(doctor).values(input).returning();
    if (!row) throw new Error("Failed to create doctor");
    return toDoctor(row);
  }

  async list(): Promise<Doctor[]> {
    const rows = await this.db.select().from(doctor);
    return rows.map(toDoctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    const [row] = await this.db.select().from(doctor).where(eq(doctor.id, id));
    return row ? toDoctor(row) : null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const [row] = await this.db.select().from(doctor).where(eq(doctor.userId, userId));
    return row ? toDoctor(row) : null;
  }

  async update(input: Doctor): Promise<Doctor> {
    const [row] = await this.db
      .update(doctor)
      .set({
        name: input.name,
        specialization: input.specialization,
        imageUrl: input.imageUrl,
        title: input.title,
        department: input.department,
        licenseNumber: input.licenseNumber,
        contactPhone: input.contactPhone,
        bio: input.bio,
        yearsOfExperience: input.yearsOfExperience,
      })
      .where(eq(doctor.id, input.id))
      .returning();
    if (!row) throw new Error("Failed to update doctor");
    return toDoctor(row);
  }
}
