import { describe, expect, it } from "vitest";
import { parseAppointment } from "../domain/appointment";
import { parseTreatment } from "../domain/treatment";
import {
  filterAppointmentsByCalendarRange,
  filterTreatmentsByCalendarRange,
  getCalendarDateRange,
  isDateInCalendarRange,
} from "./calendar-date-filter";
import type { Appointment } from "../domain/appointment";
import type { Treatment } from "../domain/treatment";

const ref = new Date("2026-04-15T14:00:00.000Z");

function minimalTreatment(id: string, treatmentDate: Date): Treatment {
  return parseTreatment({
    id,
    userId: "u1",
    treatmentType: "injectable",
    serviceType: "Botox",
    brand: "",
    treatmentDate,
    treatmentAreas: [],
    units: 0,
    providerId: "",
    notes: "",
  });
}

function minimalAppointment(id: string, scheduledAt: Date): Appointment {
  return parseAppointment({
    id,
    userId: "u1",
    appointmentKind: "treatment",
    treatmentType: "injectable",
    serviceType: "x",
    brand: "",
    scheduledAt,
    durationMinutes: 30,
    providerId: null,
    providerName: null,
    notes: "",
    status: "scheduled",
    externalRef: null,
  });
}

describe("getCalendarDateRange", () => {
  it("returns null for all", () => {
    expect(getCalendarDateRange({ kind: "all" }, ref)).toBeNull();
  });

  it("thisMonth contains ref date", () => {
    const r = getCalendarDateRange({ kind: "preset", preset: "thisMonth" }, ref);
    expect(r).not.toBeNull();
    expect(ref.getTime()).toBeGreaterThanOrEqual(r!.start.getTime());
    expect(ref.getTime()).toBeLessThanOrEqual(r!.end.getTime());
  });

  it("last3Months starts at start of month three months prior", () => {
    const r = getCalendarDateRange({ kind: "preset", preset: "last3Months" }, ref);
    expect(r).not.toBeNull();
    // April 2026 - 3 months = January 2026
    expect(r!.start.getUTCMonth()).toBe(0);
    expect(r!.start.getUTCDate()).toBe(1);
  });

  it("monthYear uses given month and year", () => {
    const r = getCalendarDateRange({ kind: "monthYear", month: 1, year: 2025 }, ref);
    expect(r).not.toBeNull();
    expect(r!.start.getFullYear()).toBe(2025);
    expect(r!.start.getMonth()).toBe(1);
  });
});

describe("filterTreatmentsByCalendarRange", () => {
  it("passes all when range is null", () => {
    const t = [minimalTreatment("1", new Date("2020-01-01"))];
    expect(filterTreatmentsByCalendarRange(t, null)).toEqual(t);
  });

  it("keeps only rows in range", () => {
    const t = [
      minimalTreatment("1", new Date("2026-04-10T12:00:00.000Z")),
      minimalTreatment("2", new Date("2025-12-01T12:00:00.000Z")),
    ];
    const range = {
      start: new Date("2026-04-01T00:00:00.000Z"),
      end: new Date("2026-04-30T23:59:59.999Z"),
    };
    const out = filterTreatmentsByCalendarRange(t, range);
    expect(out.map((x) => x.id)).toEqual(["1"]);
  });
});

describe("filterAppointmentsByCalendarRange", () => {
  it("filters scheduledAt", () => {
    const a = [
      minimalAppointment("a", new Date("2026-04-20T15:00:00.000Z")),
      minimalAppointment("b", new Date("2026-06-01T15:00:00.000Z")),
    ];
    const range = getCalendarDateRange({ kind: "monthYear", month: 3, year: 2026 }, ref);
    const out = filterAppointmentsByCalendarRange(a, range);
    expect(out.map((x) => x.id)).toEqual(["a"]);
  });
});

describe("isDateInCalendarRange", () => {
  it("is inclusive of boundaries", () => {
    const range = { start: new Date("2026-04-01T00:00:00.000Z"), end: new Date("2026-04-30T00:00:00.000Z") };
    expect(isDateInCalendarRange(new Date("2026-04-01T00:00:00.000Z"), range)).toBe(true);
    expect(isDateInCalendarRange(new Date("2026-04-15T00:00:00.000Z"), range)).toBe(true);
  });
});
