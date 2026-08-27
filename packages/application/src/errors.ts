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

export class LabResultNotFoundError extends ApplicationError {
  constructor() {
    super("Laboratory result not found");
  }
}

export class LabTestCatalogItemNotFoundError extends ApplicationError {
  constructor() {
    super("Laboratory test catalog item not found");
  }
}

export class LabResultConcurrentUpdateError extends ApplicationError {
  constructor() {
    super("This laboratory result was changed by someone else — reload it and try again");
  }
}

export class ReviewInterpretationRequiredError extends ApplicationError {
  constructor() {
    super("A clinical interpretation is required to review a laboratory result");
  }
}

export class UserAccountNotFoundError extends ApplicationError {
  constructor() {
    super("Account not found");
  }
}

export class CannotModifyOwnAccountError extends ApplicationError {
  constructor() {
    super("You can't change your own role or disable your own account — ask another administrator");
  }
}
