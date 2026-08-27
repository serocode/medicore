import type { Hono } from "hono";

export interface RegisterPatientOptions {
  cookie: string;
  doctorId: string;
  overrides?: Record<string, string>;
}

export async function registerTestPatient(
  app: Hono,
  { cookie, doctorId, overrides = {} }: RegisterPatientOptions,
): Promise<Response> {
  const formData = new FormData();
  const fields: Record<string, string> = {
    birthDate: "1990-01-01",
    gender: "other",
    address: "1 Test St",
    occupation: "Tester",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "555-0000",
    primaryPhysicianId: doctorId,
    identificationType: "Passport",
    identificationNumber: "X1234567",
    consentTreatment: "true",
    consentDisclosure: "true",
    consentPrivacy: "true",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  formData.append(
    "identificationDocument",
    new File(["test-id-content"], "id.pdf", { type: "application/pdf" }),
  );

  return app.request("/api/patients/register", {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
}

export async function updateTestPatient(
  app: Hono,
  { cookie, doctorId, overrides = {} }: RegisterPatientOptions,
): Promise<Response> {
  const formData = new FormData();
  const fields: Record<string, string> = {
    birthDate: "1990-01-01",
    gender: "other",
    address: "1 Test St",
    occupation: "Tester",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "555-0000",
    primaryPhysicianId: doctorId,
    identificationType: "Passport",
    identificationNumber: "X1234567",
    consentTreatment: "true",
    consentDisclosure: "true",
    consentPrivacy: "true",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return app.request("/api/patients/me", {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: formData,
  });
}
