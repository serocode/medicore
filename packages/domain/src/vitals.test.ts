import { describe, expect, it } from "vitest";
import { calculateBmi } from "./vitals.js";

describe("calculateBmi", () => {
  it("computes BMI from weight and height", () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
  });

  it("returns null when either measurement is missing", () => {
    expect(calculateBmi(null, 175)).toBeNull();
    expect(calculateBmi(70, null)).toBeNull();
  });

  it("returns null for a non-positive height", () => {
    expect(calculateBmi(70, 0)).toBeNull();
  });
});
