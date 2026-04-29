import type { EbdModality } from "../domain/ebd-modality";
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
import {
  deleteTreatmentPhotoPaths,
  MAX_TREATMENT_PHOTOS,
  signedUrlsForTreatmentPhotoPaths,
  uploadTreatmentPhotoFiles,
} from "../services/supabase/treatment-photos";

const TREATMENT_SELECT = "*, ebd_indications ( id, modality, name )";

export type CreateTreatmentInput = {
  treatmentType: TreatmentType;
  serviceType: string;
  brand: string;
  /** When `treatmentType === "laser"`, links to `ebd_indications`. */
  ebdIndicationId?: string | null;
  /** Client-known modality for offline optimistic rows (matches selected EBD modality). */
  ebdModality?: EbdModality | null;
  treatmentAreas: string[];
  units: number;
  /** Required provider id */
  providerId: string;
  treatmentDate: Date;
  notes: string;
  cost: number | null;
  /** Offline-queued creates only (storage paths). Local uploads use `photoChanges`. */
  photoUrls?: string[];
  /** Parallel to `photoUrls` when queued with paths (optional). */
  photoCapturedAt?: Date[];
};

export type UpdateTreatmentInput = CreateTreatmentInput;

export type TreatmentPhotoChanges = {
  addLocal?: { uri: string; mimeType?: string; capturedAt?: Date }[];
  removeStoragePaths?: string[];
};

function alignedPhotoCapturedAt(photoUrls: string[], explicit: Date[] | undefined, fallback: Date): Date[] {
  return photoUrls.map((_, i) => explicit?.[i] ?? fallback);
}

function isoTimestamptzArray(dates: Date[]): string[] {
  return dates.map((d) => d.toISOString());
}

function hasPhotoWork(c?: TreatmentPhotoChanges): boolean {
  return Boolean(c?.addLocal?.length || c?.removeStoragePaths?.length);
}

function normalizeRequiredProviderId(providerId: string): string {
  const trimmed = providerId.trim();
  if (!trimmed) {
    throw new Error("Provider is required.");
  }
  return trimmed;
}

async function assertOnlineForTreatmentPhotos(c?: TreatmentPhotoChanges): Promise<void> {
  if (hasPhotoWork(c) && (await isDeviceOffline())) {
    throw new Error("Connect to the internet to add or remove treatment photos.");
  }
}

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
      .select(TREATMENT_SELECT)
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
    .select(TREATMENT_SELECT)
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

export async function fetchTreatmentPhotoSignedUrls(photoPaths: string[]): Promise<string[]> {
  if (!isSupabaseConfigured() || photoPaths.length === 0) {
    return [];
  }
  return signedUrlsForTreatmentPhotoPaths(getSupabase(), photoPaths);
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
  const photoUrls = input.photoUrls ?? [];
  await enqueueOutboxWrite(
    uid,
    "treatment_create",
    serializeTreatmentCreatePayload(id, {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      ebdIndicationId: input.ebdIndicationId ?? null,
      ebdModality: input.ebdModality ?? null,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate,
      notes: input.notes,
      cost: input.cost,
      photoUrls,
      photoCapturedAt: input.photoCapturedAt,
    }),
  );
  const syn = syntheticTreatmentFromInput(id, uid, {
    ...input,
    photoUrls,
    photoCapturedAt: alignedPhotoCapturedAt(photoUrls, input.photoCapturedAt, input.treatmentDate),
    ebdTreatmentCategory: input.treatmentType === "laser" ? input.serviceType.trim() : "",
    ebdModality: input.ebdModality ?? null,
  });
  await patchTreatmentsListCache(uid, (cur) => [syn, ...cur.filter((t) => t.id !== id)]);
  throw new WriteQueuedError();
}

async function queueTreatmentUpdate(uid: string, id: string, input: UpdateTreatmentInput): Promise<never> {
  const cur = (await readTreatmentsListCache(uid)) ?? [];
  const prev = cur.find((t) => t.id === id);
  const photoUrls = input.photoUrls ?? prev?.photoUrls ?? [];

  await enqueueOutboxWrite(
    uid,
    "treatment_update",
    serializeTreatmentUpdatePayload(id, {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      ebdIndicationId: input.ebdIndicationId ?? null,
      ebdModality: input.ebdModality ?? null,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate,
      notes: input.notes,
      cost: input.cost,
    }),
  );
  const syn = syntheticTreatmentFromInput(id, uid, {
    ...input,
    photoUrls,
    photoCapturedAt: alignedPhotoCapturedAt(
      photoUrls,
      input.photoCapturedAt ?? prev?.photoCapturedAt,
      input.treatmentDate,
    ),
    ebdTreatmentCategory: input.treatmentType === "laser" ? input.serviceType.trim() : "",
    ebdModality: input.ebdModality ?? null,
  });
  await patchTreatmentsListCache(uid, (curList) => curList.map((t) => (t.id === id ? syn : t)));
  throw new WriteQueuedError();
}

async function queueTreatmentDelete(uid: string, id: string): Promise<never> {
  await enqueueOutboxWrite(uid, "treatment_delete", JSON.stringify({ id }));
  await patchTreatmentsListCache(uid, (cur) => cur.filter((t) => t.id !== id));
  throw new WriteQueuedError();
}

export async function createTreatmentForCurrentUser(
  input: CreateTreatmentInput,
  photoChanges?: TreatmentPhotoChanges,
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

  await assertOnlineForTreatmentPhotos(photoChanges);

  if (await isDeviceOffline()) {
    await queueTreatmentCreate(uid, {
      ...input,
      photoUrls: input.photoUrls ?? [],
      photoCapturedAt: input.photoCapturedAt,
    });
  }

  const providerId = normalizeRequiredProviderId(input.providerId);

  const initialPhotos = input.photoUrls ?? [];
  const addCount = photoChanges?.addLocal?.length ?? 0;
  if (initialPhotos.length + addCount > MAX_TREATMENT_PHOTOS) {
    throw new Error(`At most ${MAX_TREATMENT_PHOTOS} photos per treatment.`);
  }

  const ebdId =
    input.ebdIndicationId && input.ebdIndicationId.trim() !== ""
      ? input.ebdIndicationId.trim()
      : null;

  const initialCaptured = alignedPhotoCapturedAt(
    initialPhotos,
    input.photoCapturedAt,
    input.treatmentDate,
  );

  const row = {
    user_id: uid,
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    ebd_indication_id: input.treatmentType === "laser" ? ebdId : null,
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
    photo_urls: initialPhotos,
    photo_captured_at: isoTimestamptzArray(initialCaptured),
  };

  try {
    const { data, error } = await supabase.from("treatments").insert(row).select(TREATMENT_SELECT).single();

    if (error) {
      throw new Error(error.message);
    }

    void adjustTreatmentCount(supabase, uid, 1);

    let t = treatmentFromRow(data as TreatmentRow);

    if (photoChanges?.addLocal?.length) {
      const uploaded = await uploadTreatmentPhotoFiles(supabase, uid, t.id, photoChanges.addLocal);
      const merged = [...initialPhotos, ...uploaded];
      const addCaptured = photoChanges.addLocal.map((pick) => pick.capturedAt ?? input.treatmentDate);
      const mergedCaptured = [...initialCaptured, ...addCaptured];
      const { data: u2, error: e2 } = await supabase
        .from("treatments")
        .update({
          photo_urls: merged,
          photo_captured_at: isoTimestamptzArray(mergedCaptured),
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id)
        .eq("user_id", uid)
        .select(TREATMENT_SELECT)
        .single();
      if (e2) {
        throw new Error(e2.message);
      }
      t = treatmentFromRow(u2 as TreatmentRow);
    }

    await patchTreatmentsListCache(uid, (cur) => {
      const rest = cur.filter((x) => x.id !== t.id);
      return [t, ...rest];
    });
    return t;
  } catch (e) {
    if (await isDeviceOffline()) {
      await queueTreatmentCreate(uid, {
        ...input,
        photoUrls: input.photoUrls ?? [],
        photoCapturedAt: input.photoCapturedAt,
      });
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function updateTreatmentForCurrentUser(
  id: string,
  input: UpdateTreatmentInput,
  photoChanges?: TreatmentPhotoChanges,
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

  await assertOnlineForTreatmentPhotos(photoChanges);

  if (await isDeviceOffline()) {
    await queueTreatmentUpdate(uid, id, input);
  }

  const providerId = normalizeRequiredProviderId(input.providerId);

  const ebdId =
    input.ebdIndicationId && input.ebdIndicationId.trim() !== ""
      ? input.ebdIndicationId.trim()
      : null;

  const upd: Record<string, unknown> = {
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    ebd_indication_id: input.treatmentType === "laser" ? ebdId : null,
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
    updated_at: new Date().toISOString(),
  };

  let removeFromStorage: string[] = [];
  if (hasPhotoWork(photoChanges)) {
    const existing = await fetchTreatmentById(id);
    if (!existing) {
      throw new Error("Treatment not found or access denied.");
    }
    const fb = existing.treatmentDate;
    const effectiveCaptured = existing.photoUrls.map(
      (_, i) => existing.photoCapturedAt[i] ?? fb,
    );
    let nextPhotos = [...existing.photoUrls];
    let nextCaptured = [...effectiveCaptured];
    const remove = photoChanges?.removeStoragePaths ?? [];
    removeFromStorage = remove;
    if (remove.length) {
      nextPhotos = nextPhotos.filter((p) => !remove.includes(p));
      nextCaptured = existing.photoUrls
        .map((p, i) => ({ p, c: effectiveCaptured[i] }))
        .filter((x) => !remove.includes(x.p))
        .map((x) => x.c);
    }
    if (photoChanges?.addLocal?.length) {
      const uploaded = await uploadTreatmentPhotoFiles(supabase, uid, id, photoChanges.addLocal);
      const addCaptured = photoChanges.addLocal.map((pick) => pick.capturedAt ?? input.treatmentDate);
      nextPhotos = [...nextPhotos, ...uploaded];
      nextCaptured = [...nextCaptured, ...addCaptured];
    }
    if (nextPhotos.length > MAX_TREATMENT_PHOTOS) {
      throw new Error(`At most ${MAX_TREATMENT_PHOTOS} photos per treatment.`);
    }
    upd.photo_urls = nextPhotos;
    upd.photo_captured_at = isoTimestamptzArray(nextCaptured);
  }

  try {
    const { data, error } = await supabase
      .from("treatments")
      .update(upd)
      .eq("id", id)
      .eq("user_id", uid)
      .select(TREATMENT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error("Treatment not found or access denied.");
    }

    if (removeFromStorage.length) {
      try {
        await deleteTreatmentPhotoPaths(supabase, removeFromStorage);
      } catch {
        /* best-effort cleanup */
      }
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
      .select("photo_urls")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error("Treatment not found or access denied.");
    }

    const urls = (data as { photo_urls?: string[] | null }).photo_urls;
    if (urls?.length) {
      try {
        await deleteTreatmentPhotoPaths(supabase, urls);
      } catch {
        /* best-effort */
      }
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
