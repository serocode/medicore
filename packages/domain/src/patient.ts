import { MissingConsentError } from "./errors.js";

export interface PatientConsent {
  consentTreatment: boolean;
  consentDisclosure: boolean;
  consentPrivacy: boolean;
}

export function assertConsentGiven(consent: PatientConsent): void {
  if (!consent.consentTreatment || !consent.consentDisclosure || !consent.consentPrivacy) {
    throw new MissingConsentError();
  }
}
