import { z } from "zod";

/**
 * Structured implant fields for `treatments.surgical_details` (JSONB).
 * Aligned with GitHub issue #52 — core, implant-specific, and follow-up/history.
 */
export const surgicalDetailsSchema = z.object({
  implantCategory: z.string().optional(),
  /** Legacy: anatomical site now uses `treatments.treatment_areas`; keep for old JSON. */
  bodyArea: z.string().optional(),
  side: z.string().optional(),
  primaryReasonGoal: z.string().optional(),
  implantType: z.string().optional(),
  implantMaterial: z.string().optional(),
  brandManufacturer: z.string().optional(),
  model: z.string().optional(),
  shape: z.string().optional(),
  textureSurface: z.string().optional(),
  fillContents: z.string().optional(),
  sizeVolume: z.string().optional(),
  projectionProfile: z.string().optional(),
  placementPlane: z.string().optional(),
  incisionLocation: z.string().optional(),
  pocketPosition: z.string().optional(),
  laterality: z.string().optional(),
  revisionOrFirstTime: z.string().optional(),
  serialLotNumber: z.string().optional(),
  implantStatus: z.string().optional(),
  complications: z.string().optional(),
  removalDate: z.string().optional(),
  exchangeDate: z.string().optional(),
  reasonForRevision: z.string().optional(),
  currentStatus: z.string().optional(),
  relatedPhotosDocumentsNote: z.string().optional(),
});

export type SurgicalDetails = z.infer<typeof surgicalDetailsSchema>;

export function emptySurgicalDetails(): SurgicalDetails {
  return {};
}

export function parseSurgicalDetailsFromUnknown(raw: unknown): SurgicalDetails {
  const r = surgicalDetailsSchema.safeParse(raw);
  return r.success ? r.data : {};
}

/** Strip empty strings; return null if nothing left (omit JSONB column). */
export function pruneSurgicalDetailsForStorage(d: SurgicalDetails): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}
