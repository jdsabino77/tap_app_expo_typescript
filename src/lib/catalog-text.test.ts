import { describe, expect, it } from "vitest";
import { toggleCommaListItem } from "./catalog-text";

describe("toggleCommaListItem", () => {
  it("appends when absent", () => {
    expect(toggleCommaListItem("", "Forehead")).toBe("Forehead");
    expect(toggleCommaListItem("Chin", "Forehead")).toBe("Chin, Forehead");
  });

  it("removes when present (case-insensitive)", () => {
    expect(toggleCommaListItem("Forehead, Chin", "forehead")).toBe("Chin");
  });

  it("trims noise", () => {
    expect(toggleCommaListItem("  a  ,  b  ", "a")).toBe("b");
  });
});
