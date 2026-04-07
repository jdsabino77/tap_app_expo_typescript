import { z } from "zod";

/** `laserTypes` collection / seed rows */
export const laserTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
});

/** `serviceTypes` collection */
export const serviceTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
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
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export type LaserType = z.infer<typeof laserTypeSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type TreatmentArea = z.infer<typeof treatmentAreaSchema>;
export type ProviderServiceCatalogItem = z.infer<typeof providerServiceCatalogSchema>;
