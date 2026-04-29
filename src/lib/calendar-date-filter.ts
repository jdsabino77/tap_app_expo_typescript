import {
  endOfDay,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import type { Appointment } from "../domain/appointment";
import type { Treatment } from "../domain/treatment";

/** Quick date-range presets (resolved against “now” when applied). */
export type CalendarDatePreset = "thisMonth" | "thisYear" | "last3Months";

export type CalendarDateFilterState =
  | { kind: "all" }
  | { kind: "preset"; preset: CalendarDatePreset }
  /** `month` is 0–11 (JavaScript Date convention). */
  | { kind: "monthYear"; month: number; year: number };

export const defaultCalendarDateFilterState: CalendarDateFilterState = { kind: "all" };

/**
 * Returns null when no filtering; otherwise inclusive [start, end] for calendar rows.
 * Last 3 months: start of the calendar month three months before `now`, through end of today.
 */
export function getCalendarDateRange(
  state: CalendarDateFilterState,
  now: Date,
): { start: Date; end: Date } | null {
  if (state.kind === "all") {
    return null;
  }
  if (state.kind === "preset") {
    switch (state.preset) {
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "thisYear":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "last3Months":
        return { start: startOfMonth(subMonths(now, 3)), end: endOfDay(now) };
    }
  }
  const anchor = new Date(state.year, state.month, 1);
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function isDateInCalendarRange(date: Date, range: { start: Date; end: Date } | null): boolean {
  if (range == null) {
    return true;
  }
  return isWithinInterval(date, range);
}

export function filterTreatmentsByCalendarRange(
  treatments: Treatment[],
  range: { start: Date; end: Date } | null,
): Treatment[] {
  if (range == null) {
    return treatments;
  }
  return treatments.filter((t) => isDateInCalendarRange(t.treatmentDate, range));
}

export function filterAppointmentsByCalendarRange(
  appointments: Appointment[],
  range: { start: Date; end: Date } | null,
): Appointment[] {
  if (range == null) {
    return appointments;
  }
  return appointments.filter((a) => isDateInCalendarRange(a.scheduledAt, range));
}
