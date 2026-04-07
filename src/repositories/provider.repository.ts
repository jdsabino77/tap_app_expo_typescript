import { providerFromRemote, type Provider } from "../domain/provider";
import { newUuid } from "../lib/ids";
import { isDeviceOffline } from "../lib/device-offline";
import { WriteQueuedError } from "../lib/write-queued-error";
import {
  patchProvidersListCache,
  readProvidersListCache,
  syntheticProviderFromInput,
  writeProvidersListCache,
} from "../services/local/providers-list-cache";
import {
  enqueueOutboxWrite,
  serializeProviderCreatePayload,
  serializeProviderUpdatePayload,
} from "../services/local/write-queue";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

/** Stale list from device cache (null if none). */
export async function readCachedProvidersForCurrentUser(): Promise<Provider[] | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return null;
  }
  return readProvidersListCache(userData.user.id);
}

export async function fetchProvidersForCurrentUser(): Promise<Provider[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return [];
  }
  const uid = userData.user.id;

  try {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    const list = (data ?? []).map((row: Record<string, unknown>) =>
      providerFromRemote(String(row.id), row as Record<string, unknown>),
    );
    await writeProvidersListCache(uid, list);
    return list;
  } catch (e) {
    const cached = await readProvidersListCache(uid);
    if (cached != null) {
      return cached;
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
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

function payloadFields(input: CreateProviderInput) {
  return {
    name: input.name.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    specialties: input.specialties.map((s) => s.trim()).filter(Boolean),
  };
}

async function queueProviderCreate(uid: string, input: CreateProviderInput): Promise<never> {
  const id = newUuid();
  const fields = payloadFields(input);
  await enqueueOutboxWrite(uid, "provider_create", serializeProviderCreatePayload(id, fields));
  const syn = syntheticProviderFromInput(id, fields);
  await patchProvidersListCache(uid, (cur) => [syn, ...cur.filter((p) => p.id !== id)]);
  throw new WriteQueuedError();
}

async function queueProviderUpdate(uid: string, id: string, input: CreateProviderInput): Promise<never> {
  const fields = payloadFields(input);
  await enqueueOutboxWrite(uid, "provider_update", serializeProviderUpdatePayload(id, fields));
  const syn = syntheticProviderFromInput(id, fields);
  await patchProvidersListCache(uid, (cur) => cur.map((p) => (p.id === id ? syn : p)));
  throw new WriteQueuedError();
}

async function queueProviderDeactivate(uid: string, id: string): Promise<never> {
  await enqueueOutboxWrite(uid, "provider_deactivate", JSON.stringify({ id }));
  await patchProvidersListCache(uid, (cur) => cur.filter((p) => p.id !== id));
  throw new WriteQueuedError();
}

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

  if (await isDeviceOffline()) {
    await queueProviderCreate(uid, input);
  }

  const f = payloadFields(input);
  const row = {
    name: f.name,
    address: f.address,
    city: f.city,
    province: f.province,
    postal_code: f.postalCode,
    phone: f.phone,
    email: f.email,
    website: f.website,
    specialties: f.specialties,
    is_verified: false,
    is_global: false,
    user_id: uid,
    created_by: uid,
    is_active: true,
  };

  try {
    const { data, error } = await supabase.from("providers").insert(row).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    const p = providerFromRemote(String(data.id), data as Record<string, unknown>);
    await patchProvidersListCache(uid, (cur) => {
      if (cur.some((x) => x.id === p.id)) {
        return cur.map((x) => (x.id === p.id ? p : x));
      }
      return [...cur, p];
    });
    return p;
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueProviderCreate(uid, input);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
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
  const uid = auth.user.id;

  if (await isDeviceOffline()) {
    await queueProviderUpdate(uid, id, input);
  }

  const f = payloadFields(input);
  const row = {
    name: f.name,
    address: f.address,
    city: f.city,
    province: f.province,
    postal_code: f.postalCode,
    phone: f.phone,
    email: f.email,
    website: f.website,
    specialties: f.specialties,
    updated_at: new Date().toISOString(),
  };

  try {
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
    const p = providerFromRemote(String(data.id), data as Record<string, unknown>);
    await patchProvidersListCache(uid, (cur) => cur.map((x) => (x.id === id ? p : x)));
    return p;
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueProviderUpdate(uid, id, input);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
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
  const uid = auth.user.id;

  if (await isDeviceOffline()) {
    await queueProviderDeactivate(uid, id);
  }

  try {
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
    await patchProvidersListCache(uid, (cur) => cur.filter((p) => p.id !== id));
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueProviderDeactivate(uid, id);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}
