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

/** Build a local calendar Date from `YYYY-MM-DD` and `HH:mm` (24h). Returns null if invalid. */
export function combineLocalYmdAndHm(dateYmd: string, timeHm: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeHm.trim());
  if (!dm || !tm) {
    return null;
  }
  const y = Number(dm[1]);
  const mo = Number(dm[2]) - 1;
  const d = Number(dm[3]);
  const h = Number(tm[1]);
  const mi = Number(tm[2]);
  if (h > 23 || mi > 59 || !Number.isFinite(y)) {
    return null;
  }
  const dt = new Date(y, mo, d, h, mi, 0, 0);
  return isValid(dt) ? dt : null;
}
