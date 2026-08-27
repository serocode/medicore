import type { Appointment, AppointmentRepository, NewAppointment } from "@healthcare/application";
import type { AppointmentStatus } from "@healthcare/domain";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { appointment } from "../schema/appointment.js";

function toAppointment(row: typeof appointment.$inferSelect): Appointment {
  return {
    id: row.id,
    patientId: row.patientId,
    doctorId: row.doctorId,
    reason: row.reason,
    preferredSchedule: row.preferredSchedule,
    scheduledAt: row.scheduledAt,
    status: row.status,
    cancellationReason: row.cancellationReason,
    notes: row.notes,
  };
}

export class DrizzleAppointmentRepository implements AppointmentRepository {
  constructor(private db: Db) {}

  async create(input: NewAppointment): Promise<Appointment> {
    const [row] = await this.db.insert(appointment).values(input).returning();
    if (!row) throw new Error("Failed to create appointment");
    return toAppointment(row);
  }

  async findById(id: string): Promise<Appointment | null> {
    const [row] = await this.db.select().from(appointment).where(eq(appointment.id, id));
    return row ? toAppointment(row) : null;
  }

  async update(input: Appointment): Promise<Appointment> {
    const [row] = await this.db
      .update(appointment)
      .set({
        status: input.status,
        scheduledAt: input.scheduledAt,
        cancellationReason: input.cancellationReason,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(eq(appointment.id, input.id))
      .returning();
    if (!row) throw new Error("Failed to update appointment");
    return toAppointment(row);
  }

  async listByPatientId(patientId: string): Promise<Appointment[]> {
    const rows = await this.db
      .select()
      .from(appointment)
      .where(eq(appointment.patientId, patientId));
    return rows.map(toAppointment);
  }

  async listAll(status?: AppointmentStatus): Promise<Appointment[]> {
    const rows = status
      ? await this.db.select().from(appointment).where(eq(appointment.status, status))
      : await this.db.select().from(appointment);
    return rows.map(toAppointment);
  }

  async findScheduledForDoctorAt(doctorId: string, scheduledAt: Date): Promise<Appointment | null> {
    const [row] = await this.db
      .select()
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          eq(appointment.status, "scheduled"),
          eq(appointment.scheduledAt, scheduledAt),
        ),
      );
    return row ? toAppointment(row) : null;
  }

  async countByStatus(): Promise<Record<AppointmentStatus, number>> {
    const rows = await this.db
      .select({ status: appointment.status, count: sql<number>`count(*)::int` })
      .from(appointment)
      .groupBy(appointment.status);

    const counts: Record<AppointmentStatus, number> = { pending: 0, scheduled: 0, cancelled: 0 };
    for (const row of rows) {
      counts[row.status] = row.count;
    }
    return counts;
  }
}
