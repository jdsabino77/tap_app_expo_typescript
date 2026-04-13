import type { AppliesTo } from "../domain/reference-content";
import { clearReferenceCatalogBundleCache } from "../services/local/reference-catalog-cache";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

async function afterCatalogMutation(): Promise<void> {
  await clearReferenceCatalogBundleCache();
}

function requireConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
}

async function currentUserId(): Promise<string> {
  requireConfigured();
  const supabase = getSupabase();
  const { data: auth, error: aErr } = await supabase.auth.getUser();
  if (aErr || !auth.user) {
    throw new Error("Not signed in.");
  }
  return auth.user.id;
}

// --- Laser types ---

export type AdminLaserTypeRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

export async function adminListLaserTypes(): Promise<AdminLaserTypeRow[]> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("laser_types")
    .select("id,name,description,sort_order,is_active,is_default")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description == null ? "" : String(r.description),
    sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    is_active: Boolean(r.is_active),
    is_default: Boolean(r.is_default),
  }));
}

export async function adminUpdateLaserType(
  id: string,
  patch: Partial<Pick<AdminLaserTypeRow, "name" | "description" | "sort_order" | "is_active" | "is_default">>,
): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase
    .from("laser_types")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

export async function adminInsertLaserType(): Promise<string> {
  const uid = await currentUserId();
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("laser_types")
    .insert({
      name: "New laser type",
      description: "",
      sort_order: 999,
      is_active: true,
      is_default: false,
      created_by: uid,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
  return String(data.id);
}

export async function adminDeleteLaserType(id: string): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from("laser_types").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

// --- Service types ---

export type AdminServiceTypeRow = {
  id: string;
  name: string;
  description: string;
  applies_to: AppliesTo;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

export async function adminListServiceTypes(): Promise<AdminServiceTypeRow[]> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("service_types")
    .select("id,name,description,applies_to,sort_order,is_active,is_default")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description == null ? "" : String(r.description),
    applies_to: (["injectable", "laser", "both"].includes(String(r.applies_to))
      ? r.applies_to
      : "both") as AppliesTo,
    sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    is_active: Boolean(r.is_active),
    is_default: Boolean(r.is_default),
  }));
}

export async function adminUpdateServiceType(
  id: string,
  patch: Partial<
    Pick<AdminServiceTypeRow, "name" | "description" | "applies_to" | "sort_order" | "is_active" | "is_default">
  >,
): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase
    .from("service_types")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

export async function adminInsertServiceType(): Promise<string> {
  const uid = await currentUserId();
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("service_types")
    .insert({
      name: "New service type",
      description: "",
      applies_to: "both",
      sort_order: 999,
      is_active: true,
      is_default: false,
      created_by: uid,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
  return String(data.id);
}

export async function adminDeleteServiceType(id: string): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from("service_types").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

// --- Treatment areas ---

export type AdminTreatmentAreaRow = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

export async function adminListTreatmentAreas(): Promise<AdminTreatmentAreaRow[]> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("treatment_areas")
    .select("id,name,category,sort_order,is_active,is_default")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    category: r.category == null ? "" : String(r.category),
    sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    is_active: Boolean(r.is_active),
    is_default: Boolean(r.is_default),
  }));
}

export async function adminUpdateTreatmentArea(
  id: string,
  patch: Partial<
    Pick<AdminTreatmentAreaRow, "name" | "category" | "sort_order" | "is_active" | "is_default">
  >,
): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase
    .from("treatment_areas")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

export async function adminInsertTreatmentArea(): Promise<string> {
  const uid = await currentUserId();
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("treatment_areas")
    .insert({
      name: "New area",
      category: "",
      sort_order: 999,
      is_active: true,
      is_default: false,
      created_by: uid,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
  return String(data.id);
}

export async function adminDeleteTreatmentArea(id: string): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from("treatment_areas").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

// --- Provider service catalog ---

export type AdminProviderServiceRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
};

export async function adminListProviderServices(): Promise<AdminProviderServiceRow[]> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("provider_service_catalog")
    .select("id,name,description,sort_order,is_active,is_default")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description == null ? "" : String(r.description),
    sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    is_active: Boolean(r.is_active),
    is_default: Boolean(r.is_default),
  }));
}

export async function adminUpdateProviderService(
  id: string,
  patch: Partial<
    Pick<AdminProviderServiceRow, "name" | "description" | "sort_order" | "is_active" | "is_default">
  >,
): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase
    .from("provider_service_catalog")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

export async function adminInsertProviderService(): Promise<string> {
  const uid = await currentUserId();
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("provider_service_catalog")
    .insert({
      name: "New provider service",
      description: "",
      sort_order: 999,
      is_active: true,
      is_default: false,
      created_by: uid,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
  return String(data.id);
}

export async function adminDeleteProviderService(id: string): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from("provider_service_catalog").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

// --- EBD indications ---

export type AdminEbdIndicationRow = {
  id: string;
  modality: "laser" | "photofacial";
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export async function adminListEbdIndications(): Promise<AdminEbdIndicationRow[]> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ebd_indications")
    .select("id,modality,name,description,sort_order,is_active")
    .order("modality", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    modality: r.modality === "photofacial" ? "photofacial" : "laser",
    name: String(r.name ?? ""),
    description: r.description == null ? "" : String(r.description),
    sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    is_active: Boolean(r.is_active),
  }));
}

export async function adminUpdateEbdIndication(
  id: string,
  patch: Partial<Pick<AdminEbdIndicationRow, "modality" | "name" | "description" | "sort_order" | "is_active">>,
): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase
    .from("ebd_indications")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}

export async function adminInsertEbdIndication(): Promise<string> {
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ebd_indications")
    .insert({
      modality: "laser",
      name: "New EBD category",
      description: "",
      sort_order: 999,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
  return String(data.id);
}

export async function adminDeleteEbdIndication(id: string): Promise<void> {
  requireConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from("ebd_indications").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await afterCatalogMutation();
}
