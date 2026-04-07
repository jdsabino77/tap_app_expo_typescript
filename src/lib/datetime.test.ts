import { describe, expect, it } from "vitest";
import { combineLocalYmdAndHm } from "./datetime";

describe("combineLocalYmdAndHm", () => {
  it("combines local date and time", () => {
    const d = combineLocalYmdAndHm("2026-06-15", "14:30");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(5);
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(14);
    expect(d!.getMinutes()).toBe(30);
  });

  it("returns null for bad input", () => {
    expect(combineLocalYmdAndHm("nope", "14:30")).toBeNull();
    expect(combineLocalYmdAndHm("2026-01-01", "25:00")).toBeNull();
  });
});
