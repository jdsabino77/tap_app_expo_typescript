import { z } from "zod";
import { ebdModalitySchema, type EbdModality } from "./ebd-modality";
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

/**
 * `service_types.applies_to` in Supabase: injectable | laser | both | all | or any `treatment_types.slug`.
 * Semantics: see `matchesAppliesTo`.
 */
export const appliesToSchema = z.string().min(1);
export type AppliesTo = z.infer<typeof appliesToSchema>;

/** `treatment_types` reference rows (top-level modality + UX flags). */
export const treatmentTypeCatalogRowSchema = z.object({
  slug: z.string().min(1),
  name: z.string(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  useEbdServiceFlow: z.boolean().optional(),
  useLaserDeviceBrandPicker: z.boolean().optional(),
  showUnitsField: z.boolean().optional(),
});

export type TreatmentTypeCatalogRow = z.infer<typeof treatmentTypeCatalogRowSchema>;

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

/** `treatment_areas.region` — accordion grouping in treatment forms. */
export const treatmentAreaRegionSchema = z.enum(["head", "upper_body", "lower_body"]);
export type TreatmentAreaRegion = z.infer<typeof treatmentAreaRegionSchema>;

/** `treatmentAreas` collection */
export const treatmentAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  /** Body region for expandable area picker; defaults for legacy cached bundles. */
  region: treatmentAreaRegionSchema.default("head"),
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

/** `ebd_indications` — EBD treatment categories per modality (laser vs photofacial). */
export const ebdIndicationSchema = z.object({
  id: z.string(),
  modality: ebdModalitySchema,
  name: z.string(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type LaserType = z.infer<typeof laserTypeSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type ServiceTypeBrand = z.infer<typeof serviceTypeBrandSchema>;
export type TreatmentArea = z.infer<typeof treatmentAreaSchema>;
export type ProviderServiceCatalogItem = z.infer<typeof providerServiceCatalogSchema>;
export type EbdIndication = z.infer<typeof ebdIndicationSchema>;

/** Junction: `ebd_indication_laser_types` — device pick list per EBD category. */
export const ebdIndicationLaserTypeLinkSchema = z.object({
  ebdIndicationId: z.string(),
  laserTypeId: z.string(),
  order: z.number().int().optional(),
});

export type EbdIndicationLaserTypeLink = z.infer<typeof ebdIndicationLaserTypeLinkSchema>;

/** `surgical_procedures` — implant procedure labels under a `service_types` row (e.g. Implants). */
export const surgicalProcedureSchema = z.object({
  id: z.string(),
  serviceTypeId: z.string(),
  name: z.string(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type SurgicalProcedure = z.infer<typeof surgicalProcedureSchema>;

/** Serialized reference data for treatment/provider form chips (API + local cache). */
export const referenceCatalogBundleSchema = z.object({
  laserTypes: z.array(laserTypeSchema),
  serviceTypes: z.array(serviceTypeSchema),
  serviceTypeBrands: z.array(serviceTypeBrandSchema).optional().default([]),
  treatmentTypes: z.array(treatmentTypeCatalogRowSchema).optional().default([]),
  treatmentAreas: z.array(treatmentAreaSchema),
  providerServices: z.array(providerServiceCatalogSchema),
  ebdIndications: z.array(ebdIndicationSchema).optional().default([]),
  ebdIndicationLaserTypeLinks: z.array(ebdIndicationLaserTypeLinkSchema).optional().default([]),
  surgicalProcedures: z.array(surgicalProcedureSchema).optional().default([]),
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

/** Whether a `service_types.applies_to` value applies to the selected treatment type slug. */
export function matchesAppliesTo(appliesTo: string, treatmentSlug: string): boolean {
  const a = appliesTo.trim().toLowerCase();
  const slug = treatmentSlug.trim().toLowerCase();
  if (a === "all") {
    return true;
  }
  if (a === "both") {
    return slug === "injectable" || slug === "laser";
  }
  return a === slug;
}

/** Filter catalog service rows for the selected treatment modality. */
export function filterServiceTypesForTreatment(
  items: ServiceType[],
  treatmentType: TreatmentType,
): ServiceType[] {
  return items.filter((s) => matchesAppliesTo(s.appliesTo, treatmentType));
}

/** UX flags for a treatment type slug; falls back when catalog row missing (offline / stale). */
export function treatmentTypeFlagsForSlug(
  slug: string,
  rows: TreatmentTypeCatalogRow[],
): {
  useEbdServiceFlow: boolean;
  useLaserDeviceBrandPicker: boolean;
  showUnitsField: boolean;
} {
  const row = rows.find((r) => r.slug === slug);
  if (row) {
    return {
      useEbdServiceFlow: row.useEbdServiceFlow ?? false,
      useLaserDeviceBrandPicker: row.useLaserDeviceBrandPicker ?? false,
      showUnitsField: row.showUnitsField ?? false,
    };
  }
  if (slug === "injectable") {
    return { useEbdServiceFlow: false, useLaserDeviceBrandPicker: false, showUnitsField: true };
  }
  if (slug === "laser") {
    return { useEbdServiceFlow: true, useLaserDeviceBrandPicker: true, showUnitsField: false };
  }
  if (slug === "skin_treatments") {
    return { useEbdServiceFlow: false, useLaserDeviceBrandPicker: false, showUnitsField: false };
  }
  if (slug === "surgical") {
    return { useEbdServiceFlow: false, useLaserDeviceBrandPicker: false, showUnitsField: false };
  }
  return { useEbdServiceFlow: false, useLaserDeviceBrandPicker: false, showUnitsField: false };
}

export function ebdIndicationsForModality(
  items: EbdIndication[],
  modality: EbdModality,
): EbdIndication[] {
  return items.filter((r) => r.modality === modality);
}
