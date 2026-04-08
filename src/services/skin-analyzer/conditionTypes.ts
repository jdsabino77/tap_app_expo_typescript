/**
 * Per-condition area estimates — **exclusive** segmentation: each pixel maps to at most one class
 * (plus background). See docs/SKIN_ANALYZER_IOS_DESIGN.md.
 */

export type ConditionAreaEstimate = {
  id: string;
  label: string;
  /** 0–100: share of the analyzed crop for this class (definition must match training). */
  areaPercent: number;
};

/** Stub IDs for UI preview — percentages are placeholders until multi-class Core ML ships. */
export type ConditionPreviewStub = Pick<ConditionAreaEstimate, "id" | "areaPercent">;

export const exclusiveConditionPreviewStubs: ConditionPreviewStub[] = [
  { id: "melasma", areaPercent: 12.0 },
  { id: "solar_lentigines", areaPercent: 40.0 },
  { id: "freckles", areaPercent: 5.0 },
  { id: "pih", areaPercent: 8.0 },
];
