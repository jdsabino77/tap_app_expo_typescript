import {
  appliesToSchema,
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
} from "../domain/reference-content";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";
import {
  loadReferenceCatalogBundleFromCache,
  saveReferenceCatalogBundleToCache,
} from "../services/local/reference-catalog-cache";

export type { ReferenceCatalogBundle } from "../domain/reference-content";

function parseAppliesTo(raw: unknown): "injectable" | "laser" | "both" {
  const r = appliesToSchema.safeParse(raw);
  return r.success ? r.data : "both";
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

function mapAreaRow(row: Record<string, unknown>): TreatmentArea {
  return treatmentAreaSchema.parse({
    id: String(row.id),
    name: String(row.name ?? ""),
    category: row.category == null ? undefined : String(row.category),
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

  const [laserRes, serviceRes, brandRes, areaRes, provRes] = await Promise.all([
    supabase.from("laser_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("service_types").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("service_type_brands")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("treatment_areas").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("provider_service_catalog")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const err =
    laserRes.error?.message ||
    serviceRes.error?.message ||
    brandRes.error?.message ||
    areaRes.error?.message ||
    provRes.error?.message;
  if (err) {
    throw new Error(err);
  }

  return {
    laserTypes: (laserRes.data ?? []).map((r) => mapLaserRow(r as Record<string, unknown>)),
    serviceTypes: (serviceRes.data ?? []).map((r) => mapServiceRow(r as Record<string, unknown>)),
    serviceTypeBrands: (brandRes.data ?? []).map((r) => mapServiceTypeBrandRow(r as Record<string, unknown>)),
    treatmentAreas: (areaRes.data ?? []).map((r) => mapAreaRow(r as Record<string, unknown>)),
    providerServices: (provRes.data ?? []).map((r) => mapProviderServiceRow(r as Record<string, unknown>)),
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
    treatmentAreas: [],
    providerServices: [],
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
