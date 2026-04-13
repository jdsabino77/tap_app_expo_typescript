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
    { title: "EBD · Laser · Pigment / Sun Spots", subtitle: "Maps from condition_service_map + ebd_indications" },
    { title: "EBD · Photofacial · Brown Spots / Pigment", subtitle: "IPL-style options (catalog)" },
  ],
  freckles: [{ title: "EBD · Photofacial · Freckles", subtitle: "Often used for ephelides" }],
  melasma: [
    { title: "Chemical peel", subtitle: "Superficial / medium — provider plan" },
    { title: "EBD · Laser · Fractional Resurfacing", subtitle: "Selected protocols only" },
  ],
  pih: [
    { title: "Chemical peel" },
    { title: "EBD · Laser · Non-Ablative Resurfacing", subtitle: "Adjunct example" },
  ],
};
