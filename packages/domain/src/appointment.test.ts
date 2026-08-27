import { describe, expect, it } from "vitest";
import { cancelAppointment, confirmAppointment } from "./appointment.js";
import type { AppointmentState } from "./appointment.js";
import { CancellationReasonRequiredError, InvalidAppointmentTransitionError } from "./errors.js";

function pendingAppointment(): AppointmentState {
  return {
    id: "appt-1",
    doctorId: "doctor-1",
    status: "pending",
    scheduledAt: null,
    cancellationReason: null,
  };
}

describe("confirmAppointment", () => {
  it("moves a pending appointment to scheduled", () => {
    const scheduledAt = new Date("2026-09-01T10:00:00Z");
    const result = confirmAppointment(pendingAppointment(), scheduledAt);
    expect(result.status).toBe("scheduled");
    expect(result.scheduledAt).toEqual(scheduledAt);
  });

  it("rejects confirming an already-scheduled appointment", () => {
    const scheduled: AppointmentState = {
      ...pendingAppointment(),
      status: "scheduled",
      scheduledAt: new Date(),
    };
    expect(() => confirmAppointment(scheduled, new Date())).toThrow(
      InvalidAppointmentTransitionError,
    );
  });

  it("rejects confirming a cancelled appointment", () => {
    const cancelled: AppointmentState = { ...pendingAppointment(), status: "cancelled" };
    expect(() => confirmAppointment(cancelled, new Date())).toThrow(
      InvalidAppointmentTransitionError,
    );
  });
});

describe("cancelAppointment", () => {
  it("cancels a pending appointment with a reason", () => {
    const result = cancelAppointment(pendingAppointment(), "Patient requested reschedule");
    expect(result.status).toBe("cancelled");
    expect(result.cancellationReason).toBe("Patient requested reschedule");
  });

  it("requires a non-empty reason", () => {
    expect(() => cancelAppointment(pendingAppointment(), "   ")).toThrow(
      CancellationReasonRequiredError,
    );
  });

  it("rejects cancelling an already-cancelled appointment", () => {
    const cancelled: AppointmentState = { ...pendingAppointment(), status: "cancelled" };
    expect(() => cancelAppointment(cancelled, "reason")).toThrow(InvalidAppointmentTransitionError);
  });
});
