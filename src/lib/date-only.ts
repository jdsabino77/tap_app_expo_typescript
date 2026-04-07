/**
 * Postgres `date` (and ISO date-only strings) must not be interpreted as “UTC instant + format in local TZ”
 * or calendar days shift (e.g. `1977-05-16` stored → shown as `1977-05-15` in US timezones).
 *
 * Treat values that begin with `YYYY-MM-DD` as a **civil** calendar date in the user’s local timezone.
 */
export function postgresDateOnlyToLocalDate(value: unknown): Date {
  if (value == null || value === "") {
    return new Date(NaN);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return value;
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const s = String(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
      return d;
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(y, mo, day);
}
