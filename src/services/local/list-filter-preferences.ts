import { z } from "zod";
import { kvRead, kvWrite } from "./kv-async";
import type { CalendarDateFilterState } from "../../lib/calendar-date-filter";
import { defaultCalendarDateFilterState } from "../../lib/calendar-date-filter";

const calendarPresetSchema = z.enum(["thisMonth", "thisYear", "last3Months"]);

const calendarDateFilterStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("all") }),
  z.object({ kind: z.literal("preset"), preset: calendarPresetSchema }),
  z.object({
    kind: z.literal("monthYear"),
    month: z.number().int().min(0).max(11),
    year: z.number().int(),
  }),
]);

const treatmentsListFilterStateSchema = z.object({
  treatmentTypeSlugs: z.array(z.string()),
  subtypeKeys: z.array(z.string()),
});

export type TreatmentsListFilterState = z.infer<typeof treatmentsListFilterStateSchema>;

export const defaultTreatmentsListFilterState: TreatmentsListFilterState = {
  treatmentTypeSlugs: [],
  subtypeKeys: [],
};

export function calendarListFilterPrefsKey(userId: string): string {
  return `calendar_filters_v1:${userId}`;
}

export function treatmentsListFilterPrefsKey(userId: string): string {
  return `treatments_filters_v1:${userId}`;
}

export async function readCalendarListFilterPrefs(userId: string): Promise<CalendarDateFilterState> {
  const raw = await kvRead(calendarListFilterPrefsKey(userId));
  if (!raw) {
    return defaultCalendarDateFilterState;
  }
  try {
    const data: unknown = JSON.parse(raw);
    const r = calendarDateFilterStateSchema.safeParse(data);
    return r.success ? r.data : defaultCalendarDateFilterState;
  } catch {
    return defaultCalendarDateFilterState;
  }
}

export async function writeCalendarListFilterPrefs(
  userId: string,
  state: CalendarDateFilterState,
): Promise<void> {
  await kvWrite(calendarListFilterPrefsKey(userId), JSON.stringify(state));
}

export async function readTreatmentsListFilterPrefs(userId: string): Promise<TreatmentsListFilterState> {
  const raw = await kvRead(treatmentsListFilterPrefsKey(userId));
  if (!raw) {
    return defaultTreatmentsListFilterState;
  }
  try {
    const data: unknown = JSON.parse(raw);
    const r = treatmentsListFilterStateSchema.safeParse(data);
    return r.success ? r.data : defaultTreatmentsListFilterState;
  } catch {
    return defaultTreatmentsListFilterState;
  }
}

export async function writeTreatmentsListFilterPrefs(
  userId: string,
  state: TreatmentsListFilterState,
): Promise<void> {
  await kvWrite(treatmentsListFilterPrefsKey(userId), JSON.stringify(state));
}
