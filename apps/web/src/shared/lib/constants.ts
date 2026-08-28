// One definition of where the API lives. Previously api-client.ts and
// auth-client.ts each declared this fallback independently — they agreed, but
// only by coincidence.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Mirror the server's ceilings (apps/api/src/routes/encounters.ts and
// patients.ts) so oversized input is caught before a round trip rather than
// coming back as a server error.
export const MAX_CLINICAL_TEXT = 5000;
export const MAX_LINE_TEXT = 200;

export const IDENTIFICATION_TYPES = [
  "Birth Certificate",
  "Driver's License",
  "Medical Insurance Card",
  "Military ID",
  "National Identity Card",
  "Passport",
  "Green Card",
  "Social Security Card",
  "State ID",
  "Student ID",
  "Voter ID",
] as const;
