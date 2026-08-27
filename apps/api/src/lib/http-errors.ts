import {
  ApplicationError,
  AppointmentNotFoundError,
  PatientAlreadyRegisteredError,
  PatientNotFoundError,
  StaffPermissionError,
  StaffProfileNotFoundError,
} from "@healthcare/application";
import {
  CancellationReasonRequiredError,
  DoctorSlotUnavailableError,
  DomainError,
  InvalidAppointmentTransitionError,
  MissingConsentError,
} from "@healthcare/domain";
import type { Context } from "hono";
import { ZodError } from "zod";
import {
  FileTooLargeError,
  InvalidStorageKeyError,
  UnsupportedFileTypeError,
} from "./file-storage.js";

/**
 * Maps known domain/application/validation errors to HTTP responses so route
 * handlers can just `throw` instead of hand-rolling status codes everywhere.
 */
export function mapErrorToResponse(error: unknown, c: Context): Response {
  if (error instanceof ZodError) {
    return c.json({ error: "Validation failed", details: error.flatten().fieldErrors }, 400);
  }

  if (
    error instanceof PatientNotFoundError ||
    error instanceof AppointmentNotFoundError ||
    error instanceof StaffProfileNotFoundError ||
    error instanceof InvalidStorageKeyError
  ) {
    return c.json({ error: error.message }, 404);
  }

  if (
    error instanceof PatientAlreadyRegisteredError ||
    error instanceof InvalidAppointmentTransitionError ||
    error instanceof DoctorSlotUnavailableError
  ) {
    return c.json({ error: error.message }, 409);
  }

  if (error instanceof StaffPermissionError) {
    return c.json({ error: error.message }, 403);
  }

  if (
    error instanceof CancellationReasonRequiredError ||
    error instanceof MissingConsentError ||
    error instanceof UnsupportedFileTypeError ||
    error instanceof FileTooLargeError
  ) {
    return c.json({ error: error.message }, 400);
  }

  if (error instanceof DomainError || error instanceof ApplicationError) {
    return c.json({ error: error.message }, 400);
  }

  console.error("Unhandled error:", error);
  return c.json({ error: "Internal Server Error" }, 500);
}
