import { describe, expect, it } from "vitest";
import { parseAppointment } from "./appointment";

describe("parseAppointment", () => {
  it("parses consult with null treatment type", () => {
    const a = parseAppointment({
      id: "1",
      userId: "u",
      appointmentKind: "consult",
      treatmentType: null,
      serviceType: "Consultation",
      brand: "",
      scheduledAt: "2026-06-01T15:00:00.000Z",
      durationMinutes: null,
      providerId: null,
      providerName: null,
      notes: "",
      status: "scheduled",
      externalRef: null,
    });
    expect(a.appointmentKind).toBe("consult");
    expect(a.treatmentType).toBeNull();
  });

  it("parses treatment appointment", () => {
    const a = parseAppointment({
      id: "1",
      userId: "u",
      appointmentKind: "treatment",
      treatmentType: "injectable",
      serviceType: "Botulinum toxin",
      brand: "Botox",
      scheduledAt: "2026-06-01T15:00:00.000Z",
      durationMinutes: 30,
      providerId: null,
      notes: "x",
      status: "scheduled",
      externalRef: null,
    });
    expect(a.treatmentType).toBe("injectable");
  });
});
