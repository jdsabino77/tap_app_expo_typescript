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
  /** When true, user may enter a custom device / brand name. */
  isOther: z.boolean().optional(),
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

/** `service_type_brands` — pick list per `service_types` row (injectable / both forms). */
export const serviceTypeBrandSchema = z.object({
  id: z.string(),
  serviceTypeId: z.string(),
  name: z.string(),
  isOther: z.boolean().optional(),
  order: z.number().int().optional(),
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
export type ServiceTypeBrand = z.infer<typeof serviceTypeBrandSchema>;
export type TreatmentArea = z.infer<typeof treatmentAreaSchema>;
export type ProviderServiceCatalogItem = z.infer<typeof providerServiceCatalogSchema>;

/** Serialized reference data for treatment/provider form chips (API + local cache). */
export const referenceCatalogBundleSchema = z.object({
  laserTypes: z.array(laserTypeSchema),
  serviceTypes: z.array(serviceTypeSchema),
  serviceTypeBrands: z.array(serviceTypeBrandSchema).optional().default([]),
  treatmentAreas: z.array(treatmentAreaSchema),
  providerServices: z.array(providerServiceCatalogSchema),
});

export type ReferenceCatalogBundle = z.infer<typeof referenceCatalogBundleSchema>;

export function parseReferenceCatalogBundleJson(json: string): ReferenceCatalogBundle | null {
  try {
    const data: unknown = JSON.parse(json);
    const r = referenceCatalogBundleSchema.safeParse(data);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** Filter catalog service rows for the selected treatment modality. */
export function filterServiceTypesForTreatment(
  items: ServiceType[],
  treatmentType: TreatmentType,
): ServiceType[] {
  return items.filter((s) => s.appliesTo === "both" || s.appliesTo === treatmentType);
}
