import {
  type EbdIndication,
  type EbdIndicationLaserTypeLink,
  ebdIndicationLaserTypeLinkSchema,
  ebdIndicationSchema,
  type LaserType,
  laserTypeSchema,
  type ProviderServiceCatalogItem,
  providerServiceCatalogSchema,
  type ReferenceCatalogBundle,
  type ServiceType,
  type ServiceTypeBrand,
  serviceTypeBrandSchema,
  serviceTypeSchema,
  type TreatmentArea,
  treatmentAreaSchema,
  treatmentTypeCatalogRowSchema,
} from "../domain/reference-content";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";
import {
  loadReferenceCatalogBundleFromCache,
  saveReferenceCatalogBundleToCache,
} from "../services/local/reference-catalog-cache";

export type { ReferenceCatalogBundle } from "../domain/reference-content";

function parseAppliesTo(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    return "both";
  }
  return raw.trim();
}

function mapLaserRow(row: Record<string, unknown>): LaserType {
  return laserTypeSchema.parse({
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description == null ? undefined : String(row.description),
    icon: row.icon == null ? undefined : String(row.icon),
    order: toInt(row.sort_order),
    isDefault: Boolean(row.is_default),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
    isOther: row.is_other == null ? false : Boolean(row.is_other),
    createdBy: row.created_by == null ? undefined : String(row.created_by),
  });
}

function mapTreatmentTypeRow(row: Record<string, unknown>) {
  return treatmentTypeCatalogRowSchema.parse({
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    order: toInt(row.sort_order),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
    useEbdServiceFlow: Boolean(row.use_ebd_service_flow),
    useLaserDeviceBrandPicker: Boolean(row.use_laser_device_brand_picker),
    showUnitsField: Boolean(row.show_units_field),
  });
}

function mapServiceRow(row: Record<string, unknown>): ServiceType {
  return serviceTypeSchema.parse({
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description == null ? undefined : String(row.description),
    icon: row.icon == null ? undefined : String(row.icon),
    appliesTo: parseAppliesTo(row.applies_to),
    order: toInt(row.sort_order),
    isDefault: Boolean(row.is_default),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
  });
}

function parseTreatmentAreaRegion(raw: unknown): "head" | "upper_body" | "lower_body" {
  const s = raw == null ? "" : String(raw).trim().toLowerCase();
  if (s === "upper_body" || s === "lower_body") {
    return s;
  }
  return "head";
}

function mapAreaRow(row: Record<string, unknown>): TreatmentArea {
  return treatmentAreaSchema.parse({
    id: String(row.id),
    name: String(row.name ?? ""),
    category: row.category == null ? undefined : String(row.category),
    region: parseTreatmentAreaRegion(row.region),
    order: toInt(row.sort_order),
    isDefault: Boolean(row.is_default),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
  });
}

function mapServiceTypeBrandRow(row: Record<string, unknown>): ServiceTypeBrand {
  return serviceTypeBrandSchema.parse({
    id: String(row.id),
    serviceTypeId: String(row.service_type_id ?? ""),
    name: String(row.name ?? ""),
    isOther: row.is_other == null ? false : Boolean(row.is_other),
    order: toInt(row.sort_order),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
  });
}

function mapProviderServiceRow(row: Record<string, unknown>): ProviderServiceCatalogItem {
  return providerServiceCatalogSchema.parse({
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description == null ? undefined : String(row.description),
    icon: row.icon == null ? undefined : String(row.icon),
    order: toInt(row.sort_order, 0),
    isActive: row.is_active == null ? true : Boolean(row.is_active),
  });
}

function mapEbdIndicationRow(row: Record<string, unknown>): EbdIndication {
  const mod = row.modality === "photofacial" ? "photofacial" : "laser";
  return ebdIndicationSchema.parse({
    id: String(row.id),
    modality: mod,
    name: String(row.name ?? ""),
    description: row.description == null ? undefined : String(row.description),
    order: toInt(row.sort_order),
    isActive: row.is_active == null ? undefined : Boolean(row.is_active),
  });
}

function mapEbdLaserLinkRow(row: Record<string, unknown>): EbdIndicationLaserTypeLink {
  return ebdIndicationLaserTypeLinkSchema.parse({
    ebdIndicationId: String(row.ebd_indication_id ?? ""),
    laserTypeId: String(row.laser_type_id ?? ""),
    order: toInt(row.sort_order),
  });
}

function toInt(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v !== "") {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/**
 * Live reference data for treatment/provider forms — not to be confused with the `treatments` table
 * (user-logged rows). Rows are filtered to `is_active` and ordered by `sort_order`.
 */
async function fetchReferenceCatalogBundleFromRemote(): Promise<ReferenceCatalogBundle> {
  const supabase = getSupabase();

  const [laserRes, serviceRes, brandRes, ttRes, areaRes, provRes, ebdRes, ebdLaserRes] = await Promise.all([
    supabase.from("laser_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("service_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("service_type_brands")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("treatment_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("treatment_areas").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("provider_service_catalog")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("ebd_indications").select("*").eq("is_active", true).order("modality", { ascending: true }).order("sort_order", { ascending: true }),
    supabase
      .from("ebd_indication_laser_types")
      .select("ebd_indication_id,laser_type_id,sort_order")
      .order("ebd_indication_id", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  const err =
    laserRes.error?.message ||
    serviceRes.error?.message ||
    brandRes.error?.message ||
    ttRes.error?.message ||
    areaRes.error?.message ||
    provRes.error?.message ||
    ebdRes.error?.message ||
    ebdLaserRes.error?.message;
  if (err) {
    throw new Error(err);
  }

  return {
    laserTypes: (laserRes.data ?? []).map((r) => mapLaserRow(r as Record<string, unknown>)),
    serviceTypes: (serviceRes.data ?? []).map((r) => mapServiceRow(r as Record<string, unknown>)),
    serviceTypeBrands: (brandRes.data ?? []).map((r) => mapServiceTypeBrandRow(r as Record<string, unknown>)),
    treatmentTypes: (ttRes.data ?? []).map((r) => mapTreatmentTypeRow(r as Record<string, unknown>)),
    treatmentAreas: (areaRes.data ?? []).map((r) => mapAreaRow(r as Record<string, unknown>)),
    providerServices: (provRes.data ?? []).map((r) => mapProviderServiceRow(r as Record<string, unknown>)),
    ebdIndications: (ebdRes.data ?? []).map((r) => mapEbdIndicationRow(r as Record<string, unknown>)),
    ebdIndicationLaserTypeLinks: (ebdLaserRes.data ?? []).map((r) =>
      mapEbdLaserLinkRow(r as Record<string, unknown>),
    ),
  };
}

/**
 * Online-first: loads from Supabase, then writes local cache (`kv-async`: SQLite on native, `localStorage` on web).
 * On network/remote failure, returns last cached bundle if present.
 */
export async function fetchReferenceCatalogBundle(): Promise<ReferenceCatalogBundle> {
  const empty: ReferenceCatalogBundle = {
    laserTypes: [],
    serviceTypes: [],
    serviceTypeBrands: [],
    treatmentTypes: [],
    treatmentAreas: [],
    providerServices: [],
    ebdIndications: [],
    ebdIndicationLaserTypeLinks: [],
  };
  if (!isSupabaseConfigured()) {
    return empty;
  }

  try {
    const bundle = await fetchReferenceCatalogBundleFromRemote();
    await saveReferenceCatalogBundleToCache(bundle);
    return bundle;
  } catch (e) {
    const cached = await loadReferenceCatalogBundleFromCache();
    if (cached) {
      return cached;
    }
    throw e;
  }
}
