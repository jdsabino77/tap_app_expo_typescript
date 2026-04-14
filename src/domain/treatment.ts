import { z } from "zod";
import { ebdModalitySchema } from "./ebd-modality";

/** Slug from `treatment_types.slug` (e.g. injectable, laser, skin_treatments). */
export const treatmentTypeSchema = z.string().min(1);
export type TreatmentType = z.infer<typeof treatmentTypeSchema>;

export const treatmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  treatmentType: treatmentTypeSchema,
  serviceType: z.string(),
  brand: z.string(),
  /** Set when type uses EBD flow and row stores an `ebd_indications` id. */
  ebdIndicationId: z.string().nullable().optional().default(null),
  ebdModality: ebdModalitySchema.nullable().optional().default(null),
  /** Resolved label from `ebd_indications.name` (for lists without a join). */
  ebdTreatmentCategory: z.string().optional().default(""),
  treatmentAreas: z.array(z.string()),
  units: z.coerce.number().int(),
  providerId: z.string().default(""),
  treatmentDate: z.coerce.date(),
  notes: z.string().optional().default(""),
  cost: z.number().nullable().optional(),
  /** Supabase Storage object paths in bucket `treatment-photos` (userId/treatmentId/file.ext). */
  photoUrls: z.array(z.string()).optional().default([]),
  /** Parallel to `photoUrls` — when shorter or missing, UI falls back to `treatmentDate`. */
  photoCapturedAt: z.array(z.coerce.date()).optional().default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Treatment = z.infer<typeof treatmentSchema>;

export function parseTreatment(input: unknown): Treatment {
  return treatmentSchema.parse(input);
}

export type TreatmentStats = {
  totalTreatments: number;
  injectableTreatments: number;
  laserTreatments: number;
  totalUnits: number;
  totalCost: number;
  mostRecentTreatment: Treatment | null;
};

/** Mirrors Flutter `TreatmentService.getTreatmentStats` aggregation. */
export function summarizeTreatmentStats(treatments: Treatment[]): TreatmentStats {
  const sorted = [...treatments].sort(
    (a, b) => b.treatmentDate.getTime() - a.treatmentDate.getTime(),
  );

  return {
    totalTreatments: treatments.length,
    injectableTreatments: treatments.filter((t) => t.treatmentType === "injectable").length,
    laserTreatments: treatments.filter((t) => t.treatmentType === "laser").length,
    totalUnits: treatments.reduce((sum, t) => sum + (Number.isFinite(t.units) ? t.units : 0), 0),
    totalCost: treatments.reduce((sum, t) => sum + (typeof t.cost === "number" ? t.cost : 0), 0),
    mostRecentTreatment: sorted[0] ?? null,
  };
}
