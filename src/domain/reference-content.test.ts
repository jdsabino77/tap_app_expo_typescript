import { describe, expect, it } from "vitest";
import { matchesAppliesTo } from "./reference-content";

describe("matchesAppliesTo", () => {
  it("matches exact slug", () => {
    expect(matchesAppliesTo("skin_treatments", "skin_treatments")).toBe(true);
    expect(matchesAppliesTo("injectable", "laser")).toBe(false);
  });

  it("both applies only to injectable and laser", () => {
    expect(matchesAppliesTo("both", "injectable")).toBe(true);
    expect(matchesAppliesTo("both", "laser")).toBe(true);
    expect(matchesAppliesTo("both", "skin_treatments")).toBe(false);
  });

  it("all applies to any slug", () => {
    expect(matchesAppliesTo("all", "skin_treatments")).toBe(true);
    expect(matchesAppliesTo("all", "injectable")).toBe(true);
  });

  it("is case-insensitive on applies_to and slug", () => {
    expect(matchesAppliesTo("BOTH", "Injectable")).toBe(true);
    expect(matchesAppliesTo("Skin_Treatments", "skin_treatments")).toBe(true);
  });
});
