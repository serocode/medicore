export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAppointmentTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition appointment from "${from}" to "${to}"`);
  }
}

export class InvalidLabResultTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition laboratory result from "${from}" to "${to}"`);
  }
}

export class CancellationReasonRequiredError extends DomainError {
  constructor() {
    super("A cancellation reason is required");
  }
}

export class DoctorSlotUnavailableError extends DomainError {
  constructor(doctorId: string, scheduledAt: Date) {
    super(`Doctor ${doctorId} already has a scheduled appointment at ${scheduledAt.toISOString()}`);
  }
}

export class MissingConsentError extends DomainError {
  constructor() {
    super("Treatment, disclosure, and privacy consent are all required");
  }
}

export class VitalSignOutOfRangeError extends DomainError {
  constructor(label: string, value: number, min: number, max: number) {
    super(`${label} of ${value} is outside the plausible range (${min}–${max})`);
  }
}

export class OutsideClinicHoursError extends DomainError {
  constructor() {
    super("The clinic is open Monday to Friday, 08:00–12:00 and 13:00–17:00 Philippine time");
    this.name = "OutsideClinicHoursError";
  }
}

export class AppointmentInPastError extends DomainError {
  constructor() {
    super("An appointment cannot be booked in the past");
    this.name = "AppointmentInPastError";
  }
}
