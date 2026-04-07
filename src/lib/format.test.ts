import { describe, expect, it } from "vitest";
import { formatCurrency, formatInteger, formatUnits } from "./format";

describe("format", () => {
  it("formatCurrency USD", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toMatch(/\$1/);
  });

  it("formatInteger", () => {
    expect(formatInteger(1200, "en-US")).toBe("1,200");
  });

  it("formatUnits", () => {
    expect(formatUnits(42)).toBe("42");
  });
});
