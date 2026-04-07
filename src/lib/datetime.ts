import { format, isValid, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Date/time helpers replacing Flutter `intl` usage.
 *
 * **Timezone:** `date-fns` `format()` uses the **runtime local timezone** (device).
 * For wall-clock dates stored as calendar dates only, parse as UTC noon or store `YYYY-MM-DD`
 * and format without shifting — document per field in repositories.
 * Use `date-fns-tz` later if you must pin IANA zones (e.g. clinic locale).
 */

const defaultLocale = enUS;

export function parseIsoToDate(iso: string): Date | null {
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

/** Long date for lists (e.g. Apr 6, 2026). */
export function formatDisplayDate(date: Date): string {
  return format(date, "PP", { locale: defaultLocale });
}

/** Date + local time (treatment timestamps). */
export function formatDisplayDateTime(date: Date): string {
  return format(date, "PPp", { locale: defaultLocale });
}

/** Compact for tables (06/04/2026 in enUS). */
export function formatShortDate(date: Date): string {
  return format(date, "P", { locale: defaultLocale });
}

export function formatIsoForApi(date: Date): string {
  return date.toISOString();
}
