import { describe, expect, it } from "vitest";
import type { EbdIndicationLaserTypeLink, LaserType } from "../domain/reference-content";
import { laserTypesForEbdIndication } from "./treatment-ebd-laser-types";

const lasers: LaserType[] = [
  { id: "a", name: "IPL", order: 40 },
  { id: "b", name: "CO2", order: 10 },
  { id: "o", name: "Other", order: 999, isOther: true },
];

describe("laserTypesForEbdIndication", () => {
  it("returns all laser types when links array is empty (legacy / pre-migration)", () => {
    expect(laserTypesForEbdIndication("ei1", lasers, [])).toEqual(lasers);
  });

  it("returns rows for the indication ordered by link order", () => {
    const links: EbdIndicationLaserTypeLink[] = [
      { ebdIndicationId: "ei1", laserTypeId: "b", order: 20 },
      { ebdIndicationId: "ei1", laserTypeId: "a", order: 10 },
    ];
    const r = laserTypesForEbdIndication("ei1", lasers, links);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("ignores other indications", () => {
    const links: EbdIndicationLaserTypeLink[] = [
      { ebdIndicationId: "other", laserTypeId: "a", order: 0 },
    ];
    expect(laserTypesForEbdIndication("ei1", lasers, links).map((x) => x.id)).toEqual(["o"]);
  });

  it("when links exist globally but none for id, returns only isOther rows", () => {
    const links: EbdIndicationLaserTypeLink[] = [
      { ebdIndicationId: "x", laserTypeId: "a", order: 0 },
    ];
    const r = laserTypesForEbdIndication("ei1", lasers, links);
    expect(r.map((x) => x.id)).toEqual(["o"]);
  });
});
