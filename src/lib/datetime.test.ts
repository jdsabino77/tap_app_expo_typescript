import { describe, expect, it } from "vitest";
import { formatDisplayDate, formatShortDate, parseIsoToDate } from "./datetime";

describe("datetime", () => {
  it("parseIsoToDate rejects invalid", () => {
    expect(parseIsoToDate("not-a-date")).toBeNull();
  });

  it("formatDisplayDate uses enUS locale", () => {
    const d = new Date(Date.UTC(2026, 3, 6, 12, 0, 0));
    const s = formatDisplayDate(d);
    expect(s).toContain("2026");
    expect(s.length).toBeGreaterThan(4);
  });

  it("formatShortDate", () => {
    const d = new Date(2026, 3, 6);
    expect(formatShortDate(d)).toMatch(/2026/);
  });
});
