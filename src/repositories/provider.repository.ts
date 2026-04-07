import { providerFromRemote } from "../domain/provider";
import type { Provider } from "../domain/provider";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export async function fetchProvidersForCurrentUser(): Promise<Provider[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    providerFromRemote(String(row.id), row as Record<string, unknown>),
  );
}

export type CreateProviderInput = {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
};

export async function createProviderForCurrentUser(input: CreateProviderInput): Promise<Provider> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    throw new Error("Not signed in.");
  }
  const uid = auth.user.id;

  const row = {
    name: input.name.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postal_code: input.postalCode.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    specialties: input.specialties,
    is_verified: false,
    is_global: false,
    user_id: uid,
    created_by: uid,
    is_active: true,
  };

  const { data, error } = await supabase.from("providers").insert(row).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return providerFromRemote(String(data.id), data as Record<string, unknown>);
}

export type ProviderDetailResult = {
  provider: Provider;
  /** True when this row is owned by the signed-in user (not directory-only). */
  canMutate: boolean;
};

export async function fetchProviderByIdForCurrentUser(
  id: string,
): Promise<ProviderDetailResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return null;
  }

  const { data, error } = await supabase.from("providers").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const ownerId = row.user_id;
  const canMutate = typeof ownerId === "string" && ownerId === auth.user.id;

  return {
    provider: providerFromRemote(String(row.id), row),
    canMutate,
  };
}

export async function updateProviderForCurrentUser(
  id: string,
  input: CreateProviderInput,
): Promise<Provider> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    throw new Error("Not signed in.");
  }

  const row = {
    name: input.name.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postal_code: input.postalCode.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    specialties: input.specialties,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("providers")
    .update(row)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Provider not found or you cannot edit this entry.");
  }

  return providerFromRemote(String(data.id), data as Record<string, unknown>);
}

export async function deactivateProviderForCurrentUser(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    throw new Error("Not signed in.");
  }

  const { data, error } = await supabase
    .from("providers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Provider not found or you cannot remove this entry.");
  }
}
