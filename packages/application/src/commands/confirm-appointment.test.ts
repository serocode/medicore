import { DoctorSlotUnavailableError } from "@healthcare/domain";
import { describe, expect, it } from "vitest";
import { AppointmentNotFoundError } from "../errors.js";
import type { Appointment, AppointmentRepository, AppointmentWithDetails } from "../ports.js";
import { confirmAppointment } from "./confirm-appointment.js";

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-1",
    patientId: "patient-1",
    doctorId: "doctor-1",
    reason: "Checkup",
    preferredSchedule: new Date("2026-09-01T09:00:00Z"),
    scheduledAt: null,
    status: "pending",
    cancellationReason: null,
    notes: null,
    ...overrides,
  };
}

class InMemoryAppointmentRepository implements AppointmentRepository {
  constructor(private appointments: Appointment[]) {}

  async create(): Promise<Appointment> {
    throw new Error("not implemented");
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null;
  }

  async update(appointment: Appointment): Promise<Appointment> {
    this.appointments = this.appointments.map((a) => (a.id === appointment.id ? appointment : a));
    return appointment;
  }

  async listByPatientId(patientId: string): Promise<Appointment[]> {
    return this.appointments.filter((a) => a.patientId === patientId);
  }

  async listAll(): Promise<Appointment[]> {
    return this.appointments;
  }

  async listByPatientIdDetailed(): Promise<AppointmentWithDetails[]> {
    throw new Error("not implemented");
  }

  async listByDoctorIdDetailed(): Promise<AppointmentWithDetails[]> {
    throw new Error("not implemented");
  }

  async listAllDetailed(): Promise<AppointmentWithDetails[]> {
    throw new Error("not implemented");
  }

  async findScheduledForDoctorAt(doctorId: string, scheduledAt: Date): Promise<Appointment | null> {
    return (
      this.appointments.find(
        (a) =>
          a.doctorId === doctorId &&
          a.status === "scheduled" &&
          a.scheduledAt?.getTime() === scheduledAt.getTime(),
      ) ?? null
    );
  }

  async countByStatus(): Promise<Record<Appointment["status"], number>> {
    throw new Error("not implemented");
  }
}

describe("confirmAppointment", () => {
  const scheduledAt = new Date("2026-09-01T10:00:00Z");

  it("confirms a pending appointment when the slot is free", async () => {
    const pending = makeAppointment();
    const repo = new InMemoryAppointmentRepository([pending]);

    const result = await confirmAppointment(
      { appointmentId: pending.id, scheduledAt },
      { appointments: repo },
    );

    expect(result.status).toBe("scheduled");
    expect(result.scheduledAt).toEqual(scheduledAt);
  });

  it("rejects confirming when the doctor already has a scheduled appointment at that time", async () => {
    const alreadyScheduled = makeAppointment({
      id: "appt-existing",
      status: "scheduled",
      scheduledAt,
    });
    const pending = makeAppointment({ id: "appt-new" });
    const repo = new InMemoryAppointmentRepository([alreadyScheduled, pending]);

    await expect(
      confirmAppointment({ appointmentId: pending.id, scheduledAt }, { appointments: repo }),
    ).rejects.toThrow(DoctorSlotUnavailableError);
  });

  it("throws when the appointment doesn't exist", async () => {
    const repo = new InMemoryAppointmentRepository([]);

    await expect(
      confirmAppointment({ appointmentId: "missing", scheduledAt }, { appointments: repo }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });
});
