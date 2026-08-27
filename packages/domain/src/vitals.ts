import { VitalSignOutOfRangeError } from "./errors.js";

export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg === null || heightCm === null || heightCm <= 0) {
    return null;
  }
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Math.round(bmi * 10) / 10;
}

// Plausible physiological bounds, not diagnostic thresholds — wide enough to
// admit any real (if extreme) reading, narrow enough to reject data-entry
// mistakes like a negative heart rate or an SpO2 of 250.
export const VITAL_SIGN_RANGES = {
  bpSystolic: { min: 40, max: 260, label: "Systolic blood pressure" },
  bpDiastolic: { min: 20, max: 200, label: "Diastolic blood pressure" },
  heartRate: { min: 20, max: 300, label: "Heart rate" },
  respiratoryRate: { min: 4, max: 60, label: "Respiratory rate" },
  temperatureCelsius: { min: 25, max: 45, label: "Temperature" },
  oxygenSaturation: { min: 0, max: 100, label: "Oxygen saturation" },
  weightKg: { min: 0.5, max: 500, label: "Weight" },
  heightCm: { min: 20, max: 300, label: "Height" },
} as const;

export type VitalSignField = keyof typeof VITAL_SIGN_RANGES;

export function assertVitalSignsInRange(
  vitals: Partial<Record<VitalSignField, number | null | undefined>>,
): void {
  for (const field of Object.keys(VITAL_SIGN_RANGES) as VitalSignField[]) {
    const value = vitals[field];
    if (value === null || value === undefined) continue;
    const { min, max, label } = VITAL_SIGN_RANGES[field];
    if (value < min || value > max) {
      throw new VitalSignOutOfRangeError(label, value, min, max);
    }
  }
}
