import type { ConditionAreaEstimate } from "./conditionTypes";

export type RecommendedTreatmentDisplay = {
  /** e.g. service_types.name once loaded from Supabase */
  title: string;
  /** Optional device / secondary line (e.g. laser_types.name) */
  subtitle?: string;
};

/** Minimum modeled area (%) to attach stub recommendations for that row */
const STUB_AREA_THRESHOLD = 3;

/**
 * Demo-only: derives a short list of suggested services from condition rows.
 * Replace with `condition_service_map` + catalog join when the API exists.
 */
export function stubRecommendedTreatments(
  conditions: ConditionAreaEstimate[],
): RecommendedTreatmentDisplay[] {
  const seen = new Set<string>();
  const out: RecommendedTreatmentDisplay[] = [];

  for (const c of conditions) {
    if (c.areaPercent < STUB_AREA_THRESHOLD) continue;
    const items = STUB_RECOMMENDATIONS_BY_CONDITION[c.id];
    if (!items) continue;
    for (const item of items) {
      const key = `${item.title}|${item.subtitle ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }

  return out;
}

const STUB_RECOMMENDATIONS_BY_CONDITION: Record<string, RecommendedTreatmentDisplay[]> = {
  solar_lentigines: [
    { title: "Laser resurfacing", subtitle: "Ablative / fractional resurfacing (catalog)" },
    { title: "IPL photofacial", subtitle: "Intense pulsed light" },
  ],
  freckles: [{ title: "IPL photofacial", subtitle: "Often used for ephelides" }],
  melasma: [
    { title: "Chemical peel", subtitle: "Superficial / medium — provider plan" },
    { title: "Laser resurfacing", subtitle: "Selected protocols only" },
  ],
  pih: [
    { title: "Chemical peel" },
    { title: "Microneedling (RF)", subtitle: "Adjunct example" },
  ],
};
