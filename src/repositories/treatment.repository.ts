import type { Treatment, TreatmentType } from "../domain/treatment";
import { newUuid } from "../lib/ids";
import { isDeviceOffline } from "../lib/device-offline";
import { WriteQueuedError } from "../lib/write-queued-error";
import { treatmentFromRow, type TreatmentRow } from "../mappers/treatment.mapper";
import {
  patchTreatmentsListCache,
  readTreatmentsListCache,
  syntheticTreatmentFromInput,
  writeTreatmentsListCache,
} from "../services/local/treatments-list-cache";
import {
  enqueueOutboxWrite,
  serializeTreatmentCreatePayload,
  serializeTreatmentUpdatePayload,
} from "../services/local/write-queue";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type CreateTreatmentInput = {
  treatmentType: TreatmentType;
  serviceType: string;
  brand: string;
  treatmentAreas: string[];
  units: number;
  /** Empty or null → stored as null */
  providerId: string | null;
  treatmentDate: Date;
  notes: string;
  cost: number | null;
};

export type UpdateTreatmentInput = CreateTreatmentInput;

/** Stale list from device cache (null if none). */
export async function readCachedTreatmentsForCurrentUser(): Promise<Treatment[] | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return null;
  }
  return readTreatmentsListCache(userData.user.id);
}

export async function fetchTreatmentsForCurrentUser(): Promise<Treatment[]> {
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
      .from("treatments")
      .select("*")
      .eq("user_id", uid)
      .order("treatment_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const list = (data as TreatmentRow[]).map(treatmentFromRow);
    await writeTreatmentsListCache(uid, list);
    return list;
  } catch (e) {
    const cached = await readTreatmentsListCache(uid);
    if (cached != null) {
      return cached;
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function fetchTreatmentById(id: string): Promise<Treatment | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return treatmentFromRow(data as TreatmentRow);
}

async function adjustTreatmentCount(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  delta: number,
): Promise<void> {
  if (delta === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("treatment_count")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return;
  }
  const next = Math.max(0, (data?.treatment_count ?? 0) + delta);
  await supabase
    .from("profiles")
    .update({ treatment_count: next, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

async function queueTreatmentCreate(uid: string, input: CreateTreatmentInput): Promise<never> {
  const id = newUuid();
  await enqueueOutboxWrite(
    uid,
    "treatment_create",
    serializeTreatmentCreatePayload(id, {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate,
      notes: input.notes,
      cost: input.cost,
    }),
  );
  const syn = syntheticTreatmentFromInput(id, uid, input);
  await patchTreatmentsListCache(uid, (cur) => [syn, ...cur.filter((t) => t.id !== id)]);
  throw new WriteQueuedError();
}

async function queueTreatmentUpdate(uid: string, id: string, input: UpdateTreatmentInput): Promise<never> {
  await enqueueOutboxWrite(
    uid,
    "treatment_update",
    serializeTreatmentUpdatePayload(id, {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate,
      notes: input.notes,
      cost: input.cost,
    }),
  );
  const syn = syntheticTreatmentFromInput(id, uid, input);
  await patchTreatmentsListCache(uid, (cur) => cur.map((t) => (t.id === id ? syn : t)));
  throw new WriteQueuedError();
}

async function queueTreatmentDelete(uid: string, id: string): Promise<never> {
  await enqueueOutboxWrite(uid, "treatment_delete", JSON.stringify({ id }));
  await patchTreatmentsListCache(uid, (cur) => cur.filter((t) => t.id !== id));
  throw new WriteQueuedError();
}

export async function createTreatmentForCurrentUser(input: CreateTreatmentInput): Promise<Treatment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;

  if (await isDeviceOffline()) {
    await queueTreatmentCreate(uid, input);
  }

  const providerId =
    input.providerId && input.providerId.trim() !== "" ? input.providerId.trim() : null;

  const row = {
    user_id: uid,
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
  };

  try {
    const { data, error } = await supabase.from("treatments").insert(row).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    void adjustTreatmentCount(supabase, uid, 1);

    const t = treatmentFromRow(data as TreatmentRow);
    await patchTreatmentsListCache(uid, (cur) => {
      const rest = cur.filter((x) => x.id !== t.id);
      return [t, ...rest];
    });
    return t;
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueTreatmentCreate(uid, input);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function updateTreatmentForCurrentUser(
  id: string,
  input: UpdateTreatmentInput,
): Promise<Treatment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;

  if (await isDeviceOffline()) {
    await queueTreatmentUpdate(uid, id, input);
  }

  const providerId =
    input.providerId && input.providerId.trim() !== "" ? input.providerId.trim() : null;

  const upd = {
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("treatments")
      .update(upd)
      .eq("id", id)
      .eq("user_id", uid)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error("Treatment not found or access denied.");
    }
    const t = treatmentFromRow(data as TreatmentRow);
    await patchTreatmentsListCache(uid, (cur) => cur.map((x) => (x.id === id ? t : x)));
    return t;
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueTreatmentUpdate(uid, id, input);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function deleteTreatmentForCurrentUser(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;

  if (await isDeviceOffline()) {
    await queueTreatmentDelete(uid, id);
  }

  try {
    const { data, error } = await supabase
      .from("treatments")
      .delete()
      .eq("id", id)
      .eq("user_id", uid)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error("Treatment not found or access denied.");
    }

    void adjustTreatmentCount(supabase, uid, -1);
    await patchTreatmentsListCache(uid, (cur) => cur.filter((t) => t.id !== id));
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueTreatmentDelete(uid, id);
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}
