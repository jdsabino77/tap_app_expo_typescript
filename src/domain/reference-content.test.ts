import { describe, expect, it } from "vitest";
import {
  filterServiceTypesForTreatment,
  parseReferenceCatalogBundleJson,
  type ServiceType,
} from "./reference-content";

describe("filterServiceTypesForTreatment", () => {
  const items: ServiceType[] = [
    {
      id: "1",
      name: "Botox",
      appliesTo: "injectable",
    },
    {
      id: "2",
      name: "IPL",
      appliesTo: "laser",
    },
    {
      id: "3",
      name: "Peel",
      appliesTo: "both",
    },
  ];

  it("keeps injectable and both for injectable treatments", () => {
    const r = filterServiceTypesForTreatment(items, "injectable");
    expect(r.map((x) => x.name)).toEqual(["Botox", "Peel"]);
  });

  it("keeps laser and both for laser treatments", () => {
    const r = filterServiceTypesForTreatment(items, "laser");
    expect(r.map((x) => x.name)).toEqual(["IPL", "Peel"]);
  });
});

describe("parseReferenceCatalogBundleJson", () => {
  it("round-trips a minimal bundle", () => {
    const bundle = {
      laserTypes: [{ id: "a", name: "CO2" }],
      serviceTypes: [{ id: "b", name: "Botox", appliesTo: "injectable" as const }],
      treatmentAreas: [{ id: "c", name: "Forehead" }],
      providerServices: [{ id: "d", name: "Injectables" }],
    };
    const json = JSON.stringify(bundle);
    const parsed = parseReferenceCatalogBundleJson(json);
    expect(parsed).not.toBeNull();
    expect(parsed?.laserTypes[0]?.name).toBe("CO2");
    expect(parsed?.serviceTypes[0]?.appliesTo).toBe("injectable");
  });

  it("returns null on invalid json", () => {
    expect(parseReferenceCatalogBundleJson("not json")).toBeNull();
  });
});
