import { describe, expect, it } from "vitest";
import { treatmentFromRow } from "./treatment.mapper";

describe("treatmentFromRow", () => {
  it("maps snake_case row to domain", () => {
    const t = treatmentFromRow({
      id: "a",
      user_id: "u",
      treatment_type: "injectable",
      service_type: "botox",
      brand: "B",
      treatment_areas: ["Forehead"],
      units: 10,
      provider_id: null,
      treatment_date: "2026-01-15T10:00:00.000Z",
      notes: "n",
      cost: "99.50",
    });
    expect(t.id).toBe("a");
    expect(t.providerId).toBe("");
    expect(t.cost).toBe(99.5);
    expect(t.photoUrls).toEqual([]);
  });
});
