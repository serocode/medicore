export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PatientAlreadyRegisteredError extends ApplicationError {
  constructor() {
    super("A patient profile already exists for this user");
  }
}

export class PatientNotFoundError extends ApplicationError {
  constructor() {
    super("Patient not found");
  }
}

export class AppointmentNotFoundError extends ApplicationError {
  constructor() {
    super("Appointment not found");
  }
}

export class StaffProfileNotFoundError extends ApplicationError {
  constructor() {
    super("Staff profile not found");
  }
}

export class StaffPermissionError extends ApplicationError {
  constructor(message = "Not permitted for this role") {
    super(message);
  }
}
