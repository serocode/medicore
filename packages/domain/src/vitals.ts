export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg === null || heightCm === null || heightCm <= 0) {
    return null;
  }
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Math.round(bmi * 10) / 10;
}
