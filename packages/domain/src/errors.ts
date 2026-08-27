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
