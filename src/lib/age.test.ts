import { describe, expect, it } from "vitest";
import { calculateAge } from "./age";

describe("calculateAge", () => {
  it("matches birthday not yet reached this year", () => {
    const dob = new Date("1990-06-15");
    const now = new Date("2026-03-01");
    expect(calculateAge(dob, now)).toBe(35);
  });

  it("increments after birthday", () => {
    const dob = new Date("1990-06-15");
    const now = new Date("2026-07-01");
    expect(calculateAge(dob, now)).toBe(36);
  });

  it("handles same month before day", () => {
    const dob = new Date("1990-06-20");
    const now = new Date("2026-06-10");
    expect(calculateAge(dob, now)).toBe(35);
  });
});
