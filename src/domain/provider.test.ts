import { describe, expect, it } from "vitest";
import { providerFromRemote, providerFullAddress } from "./provider";

describe("providerFromRemote", () => {
  it("maps Firestore specialties to services", () => {
    const p = providerFromRemote("doc1", {
      name: "Clinic",
      address: "1 Main",
      city: "Toronto",
      province: "ON",
      postalCode: "M5V1A1",
      phone: "555",
      email: "a@b.c",
      specialties: ["Laser", "Injectable"],
      isGlobal: true,
      isActive: true,
    });
    expect(p.id).toBe("doc1");
    expect(p.services).toEqual(["Laser", "Injectable"]);
  });

  it("maps Supabase postal_code to postalCode", () => {
    const p = providerFromRemote("id", {
      name: "Clinic",
      address: "1 Main",
      city: "Toronto",
      province: "ON",
      postal_code: "M5V 1A1",
      phone: "",
      email: "",
      specialties: [],
    });
    expect(p.postalCode).toBe("M5V 1A1");
  });

  it("falls back to services key", () => {
    const p = providerFromRemote("x", {
      name: "N",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      phone: "",
      email: "",
      services: ["A"],
    });
    expect(p.services).toEqual(["A"]);
  });

  it("maps logo_url to logoUrl", () => {
    const p = providerFromRemote("id", {
      name: "N",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      phone: "",
      email: "",
      specialties: [],
      logo_url: "https://example.com/l.png",
    });
    expect(p.logoUrl).toBe("https://example.com/l.png");
  });
});

describe("providerFullAddress", () => {
  it("joins like Flutter Provider.fullAddress", () => {
    expect(
      providerFullAddress({
        address: "1 St",
        city: "C",
        province: "P",
        postalCode: "Z0Z0Z0",
      }),
    ).toBe("1 St, C, P Z0Z0Z0");
  });
});
