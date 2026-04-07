import { describe, expect, it } from "vitest";
import { parseTreatment, summarizeTreatmentStats } from "./treatment";

describe("summarizeTreatmentStats", () => {
  it("matches Flutter aggregation semantics", () => {
    const t = [
      parseTreatment({
        id: "1",
        userId: "u",
        treatmentType: "injectable",
        serviceType: "neuromodulator",
        brand: "X",
        treatmentAreas: ["Forehead"],
        units: 20,
        providerId: "p",
        treatmentDate: "2026-01-10T00:00:00.000Z",
        cost: 100,
      }),
      parseTreatment({
        id: "2",
        userId: "u",
        treatmentType: "laser",
        serviceType: "hair",
        brand: "Y",
        treatmentAreas: ["Neck"],
        units: 1,
        providerId: "p",
        treatmentDate: "2026-02-01T00:00:00.000Z",
        cost: 50,
      }),
    ];

    const s = summarizeTreatmentStats(t);
    expect(s.totalTreatments).toBe(2);
    expect(s.injectableTreatments).toBe(1);
    expect(s.laserTreatments).toBe(1);
    expect(s.totalUnits).toBe(21);
    expect(s.totalCost).toBe(150);
    expect(s.mostRecentTreatment?.id).toBe("2");
  });
});
