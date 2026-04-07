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
