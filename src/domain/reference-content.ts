import { z } from "zod";
import type { TreatmentType } from "./treatment";

/** `laserTypes` collection / seed rows */
export const laserTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
});

/** Matches `service_types.applies_to` in Supabase. */
export const appliesToSchema = z.enum(["injectable", "laser", "both"]);
export type AppliesTo = z.infer<typeof appliesToSchema>;

/** `serviceTypes` collection */
export const serviceTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  appliesTo: appliesToSchema.default("both"),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/** `treatmentAreas` collection */
export const treatmentAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/** `providerServices` catalog entries (selectable tags for providers) */
export const providerServiceCatalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export type LaserType = z.infer<typeof laserTypeSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type TreatmentArea = z.infer<typeof treatmentAreaSchema>;
export type ProviderServiceCatalogItem = z.infer<typeof providerServiceCatalogSchema>;

/** Filter catalog service rows for the selected treatment modality. */
export function filterServiceTypesForTreatment(
  items: ServiceType[],
  treatmentType: TreatmentType,
): ServiceType[] {
  return items.filter((s) => s.appliesTo === "both" || s.appliesTo === treatmentType);
}
