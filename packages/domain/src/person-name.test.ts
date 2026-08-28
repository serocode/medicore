import { describe, expect, it } from "vitest";
import { formatPersonName, splitLegacyName } from "./person-name.js";

describe("formatPersonName", () => {
  it("joins the parts in reading order", () => {
    expect(
      formatPersonName({
        firstName: "Maria",
        middleName: "Cruz",
        lastName: "Santos",
        suffix: "Jr.",
      }),
    ).toBe("Maria Cruz Santos Jr.");
  });

  it("drops the parts that aren't there", () => {
    expect(formatPersonName({ firstName: "Ana", lastName: "Reyes" })).toBe("Ana Reyes");
    expect(formatPersonName({ firstName: "Ana", middleName: null, lastName: "Reyes" })).toBe(
      "Ana Reyes",
    );
    expect(formatPersonName({ firstName: "Ana", lastName: "Reyes", suffix: "III" })).toBe(
      "Ana Reyes III",
    );
  });

  it("ignores whitespace-only parts rather than leaving double spaces", () => {
    expect(
      formatPersonName({ firstName: "Ana", middleName: "   ", lastName: "Reyes", suffix: "" }),
    ).toBe("Ana Reyes");
  });
});

describe("splitLegacyName", () => {
  it("splits a three-part name", () => {
    expect(splitLegacyName("Maria Cruz Santos")).toEqual({
      firstName: "Maria",
      middleName: "Cruz",
      lastName: "Santos",
      suffix: null,
    });
  });

  it("splits a two-part name with no middle name", () => {
    expect(splitLegacyName("Ana Reyes")).toEqual({
      firstName: "Ana",
      middleName: null,
      lastName: "Reyes",
      suffix: null,
    });
  });

  it("lifts a recognised suffix out of the surname", () => {
    expect(splitLegacyName("Jose Rizal Jr.")).toEqual({
      firstName: "Jose",
      middleName: null,
      lastName: "Rizal",
      suffix: "Jr.",
    });
  });

  it("keeps several middle names together", () => {
    expect(splitLegacyName("Maria Teresa Cruz Santos")).toMatchObject({
      firstName: "Maria",
      middleName: "Teresa Cruz",
      lastName: "Santos",
    });
  });

  it("handles the accounts that have no name at all", () => {
    expect(splitLegacyName("")).toEqual({ firstName: "", lastName: "" });
    expect(splitLegacyName("   ")).toEqual({ firstName: "", lastName: "" });
  });

  it("puts a single token in the first name rather than guessing a surname", () => {
    expect(splitLegacyName("Madonna")).toMatchObject({ firstName: "Madonna", lastName: "" });
  });

  it("round-trips a name it split", () => {
    for (const original of ["Maria Cruz Santos", "Ana Reyes", "Jose Rizal Jr."]) {
      expect(formatPersonName(splitLegacyName(original))).toBe(original);
    }
  });
});
