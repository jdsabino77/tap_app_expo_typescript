import { describe, expect, it } from "vitest";
import { parseTreatment } from "../domain/treatment";
import {
  distinctSortedSubtypeKeys,
  filterTreatmentsByListSelections,
  TREATMENT_SUBTYPE_NONE,
  treatmentSubtypeKey,
} from "./treatment-list-filter";

describe("treatmentSubtypeKey", () => {
  it("uses ebdTreatmentCategory when set", () => {
    const t = parseTreatment({
      id: "1",
      userId: "u",
      treatmentType: "laser",
      serviceType: "ignored",
      brand: "",
      ebdIndicationId: "e1",
      ebdModality: "laser",
      ebdTreatmentCategory: "Pigment",
      treatmentAreas: [],
      units: 0,
      treatmentDate: new Date(),
    });
    expect(treatmentSubtypeKey(t)).toBe("Pigment");
  });

  it("falls back to serviceType", () => {
    const t = parseTreatment({
      id: "1",
      userId: "u",
      treatmentType: "injectable",
      serviceType: "Botox",
      brand: "",
      treatmentAreas: [],
      units: 10,
      treatmentDate: new Date(),
    });
    expect(treatmentSubtypeKey(t)).toBe("Botox");
  });

  it("uses none sentinel when empty", () => {
    const t = parseTreatment({
      id: "1",
      userId: "u",
      treatmentType: "injectable",
      serviceType: "   ",
      brand: "",
      treatmentAreas: [],
      units: 0,
      treatmentDate: new Date(),
    });
    expect(treatmentSubtypeKey(t)).toBe(TREATMENT_SUBTYPE_NONE);
  });
});

describe("filterTreatmentsByListSelections", () => {
  const base = {
    id: "1",
    userId: "u",
    serviceType: "A",
    brand: "",
    treatmentAreas: [] as string[],
    units: 0,
    treatmentDate: new Date(),
  };

  it("empty selections mean no constraint", () => {
    const items = [
      parseTreatment({ ...base, id: "1", treatmentType: "injectable" }),
      parseTreatment({ ...base, id: "2", treatmentType: "laser" }),
    ];
    expect(filterTreatmentsByListSelections(items, [], [])).toHaveLength(2);
  });

  it("filters by type and subtype together", () => {
    const items = [
      parseTreatment({ ...base, id: "1", treatmentType: "injectable", serviceType: "X" }),
      parseTreatment({ ...base, id: "2", treatmentType: "laser", serviceType: "Y" }),
    ];
    const out = filterTreatmentsByListSelections(items, ["injectable"], ["X"]);
    expect(out.map((x) => x.id)).toEqual(["1"]);
  });
});

describe("distinctSortedSubtypeKeys", () => {
  it("sorts and dedupes", () => {
    const items = [
      parseTreatment({
        id: "1",
        userId: "u",
        treatmentType: "injectable",
        serviceType: "Z",
        brand: "",
        treatmentAreas: [],
        units: 0,
        treatmentDate: new Date(),
      }),
      parseTreatment({
        id: "2",
        userId: "u",
        treatmentType: "injectable",
        serviceType: "A",
        brand: "",
        treatmentAreas: [],
        units: 0,
        treatmentDate: new Date(),
      }),
    ];
    expect(distinctSortedSubtypeKeys(items)).toEqual(["A", "Z"]);
  });
});
