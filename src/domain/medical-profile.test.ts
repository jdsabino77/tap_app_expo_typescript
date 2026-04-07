import { describe, expect, it } from "vitest";
import {
  genderDisplayName,
  medicalProfileAge,
  parseMedicalProfile,
  skinTypeDescription,
} from "./medical-profile";

describe("parseMedicalProfile", () => {
  it("parses ISO strings and enums", () => {
    const p = parseMedicalProfile({
      id: "current",
      userId: "u1",
      dateOfBirth: "1990-01-15T00:00:00.000Z",
      gender: "female",
      ethnicity: "asian",
      skinType: "type3",
      allergies: ["a"],
      medications: [],
      medicalConditions: [],
      previousTreatments: [],
      notes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(p.userId).toBe("u1");
    expect(p.skinType).toBe("type3");
  });

  it("defaults list fields", () => {
    const p = parseMedicalProfile({
      id: "current",
      userId: "u1",
      dateOfBirth: "1990-01-15T00:00:00.000Z",
      gender: "male",
      ethnicity: "caucasian",
      skinType: "type2",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(p.allergies).toEqual([]);
  });
});

describe("medicalProfileAge", () => {
  it("delegates to shared age helper", () => {
    const p = parseMedicalProfile({
      id: "current",
      userId: "u1",
      dateOfBirth: "2000-06-01T00:00:00.000Z",
      gender: "preferNotToSay",
      ethnicity: "preferNotToSay",
      skinType: "type3",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(medicalProfileAge(p, new Date("2026-06-15T00:00:00.000Z"))).toBe(26);
  });
});

describe("labels", () => {
  it("matches Flutter copy for skin type III", () => {
    expect(skinTypeDescription("type3")).toContain("Type III");
  });

  it("gender display", () => {
    expect(genderDisplayName("nonBinary")).toBe("Non-binary");
  });
});
