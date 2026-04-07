import { Platform } from "react-native";
import { z } from "zod";
import { newUuid } from "../../lib/ids";
import { getSupabase, isSupabaseConfigured } from "../supabase/client";
import { deleteTreatmentPhotoPaths } from "../supabase/treatment-photos";
import { openKvCacheDb } from "./cache-db";
import { clearProvidersListCache } from "./providers-list-cache";
import { clearTreatmentsListCache } from "./treatments-list-cache";

const WEB_OUTBOX_KEY = "tap_write_outbox_v1";

export const OUTBOX_KINDS = [
  "treatment_create",
  "treatment_update",
  "treatment_delete",
  "provider_create",
  "provider_update",
  "provider_deactivate",
] as const;

export type OutboxKind = (typeof OUTBOX_KINDS)[number];

export type OutboxRow = {
  id: string;
  user_id: string;
  kind: OutboxKind;
  payload: string;
  created_at: number;
  attempts: number;
  last_error: string | null;
};

const outboxRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  kind: z.enum(OUTBOX_KINDS),
  payload: z.string(),
  created_at: z.number(),
  attempts: z.number(),
  last_error: z.string().nullable(),
});

async function readAllOutboxRows(): Promise<OutboxRow[]> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage === "undefined") {
        return [];
      }
      const raw = localStorage.getItem(WEB_OUTBOX_KEY);
      if (!raw) {
        return [];
      }
      const data: unknown = JSON.parse(raw);
      const arr = z.array(outboxRowSchema).safeParse(data);
      return arr.success ? arr.data : [];
    } catch {
      return [];
    }
  }
  const db = await openKvCacheDb();
  if (!db) {
    return [];
  }
  try {
    const rows = await db.getAllAsync<OutboxRow>(
      "SELECT id, user_id, kind, payload, created_at, attempts, last_error FROM write_outbox ORDER BY created_at ASC",
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

async function writeAllOutboxRowsWeb(rows: OutboxRow[]): Promise<void> {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(WEB_OUTBOX_KEY, JSON.stringify(rows));
    }
  } catch {
    /* ignore */
  }
}

export async function enqueueOutboxWrite(
  userId: string,
  kind: OutboxKind,
  payload: string,
): Promise<string> {
  const id = newUuid();
  const row: OutboxRow = {
    id,
    user_id: userId,
    kind,
    payload,
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  if (Platform.OS === "web") {
    const all = await readAllOutboxRows();
    all.push(row);
    await writeAllOutboxRowsWeb(all);
    return id;
  }

  const db = await openKvCacheDb();
  if (!db) {
    return id;
  }
  try {
    await db.runAsync(
      "INSERT INTO write_outbox (id, user_id, kind, payload, created_at, attempts, last_error) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [row.id, row.user_id, row.kind, row.payload, row.created_at, row.attempts, row.last_error],
    );
  } catch {
    /* ignore */
  }
  return id;
}

export async function clearAllOutboxForUser(userId: string): Promise<void> {
  const all = await readAllOutboxRows();
  const next = all.filter((r) => r.user_id !== userId);
  if (Platform.OS === "web") {
    await writeAllOutboxRowsWeb(next);
    return;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return;
  }
  try {
    await db.runAsync("DELETE FROM write_outbox WHERE user_id = ?", [userId]);
  } catch {
    /* ignore */
  }
}

async function removeOutboxRow(rowId: string): Promise<void> {
  if (Platform.OS === "web") {
    const all = await readAllOutboxRows();
    await writeAllOutboxRowsWeb(all.filter((r) => r.id !== rowId));
    return;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return;
  }
  try {
    await db.runAsync("DELETE FROM write_outbox WHERE id = ?", [rowId]);
  } catch {
    /* ignore */
  }
}

async function bumpOutboxAttempt(rowId: string, err: string): Promise<void> {
  const all = await readAllOutboxRows();
  const next = all.map((r) =>
    r.id === rowId ? { ...r, attempts: r.attempts + 1, last_error: err } : r,
  );
  if (Platform.OS === "web") {
    await writeAllOutboxRowsWeb(next);
    return;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return;
  }
  try {
    await db.runAsync(
      "UPDATE write_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?",
      [err, rowId],
    );
  } catch {
    /* ignore */
  }
}

async function adjustProfileTreatmentCount(
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

const treatmentCreatePayload = z.object({
  clientRowId: z.string(),
  input: z.object({
    treatmentType: z.enum(["injectable", "laser"]),
    serviceType: z.string(),
    brand: z.string(),
    treatmentAreas: z.array(z.string()),
    units: z.number(),
    providerId: z.string().nullable(),
    treatmentDate: z.string(),
    notes: z.string(),
    cost: z.number().nullable(),
    photoUrls: z.array(z.string()).optional(),
  }),
});

const treatmentUpdatePayload = z.object({
  id: z.string(),
  input: treatmentCreatePayload.shape.input,
});

const treatmentDeletePayload = z.object({
  id: z.string(),
});

const providerCreatePayload = z.object({
  clientRowId: z.string(),
  input: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    phone: z.string(),
    email: z.string(),
    website: z.string(),
    specialties: z.array(z.string()),
  }),
});

const providerUpdatePayload = z.object({
  id: z.string(),
  input: providerCreatePayload.shape.input,
});

const providerDeactivatePayload = z.object({
  id: z.string(),
});

async function executeOutboxRow(
  row: OutboxRow,
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
): Promise<void> {
  switch (row.kind) {
    case "treatment_create": {
      const p = treatmentCreatePayload.parse(JSON.parse(row.payload));
      const providerId =
        p.input.providerId && p.input.providerId.trim() !== "" ? p.input.providerId.trim() : null;
      const insertRow = {
        id: p.clientRowId,
        user_id: userId,
        treatment_type: p.input.treatmentType,
        service_type: p.input.serviceType.trim(),
        brand: p.input.brand.trim(),
        treatment_areas: p.input.treatmentAreas,
        units: p.input.units,
        provider_id: providerId,
        treatment_date: new Date(p.input.treatmentDate).toISOString(),
        notes: p.input.notes.trim(),
        cost: p.input.cost,
        photo_urls: p.input.photoUrls ?? [],
      };
      const { error } = await supabase.from("treatments").insert(insertRow).select("id").maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      await adjustProfileTreatmentCount(supabase, userId, 1);
      return;
    }
    case "treatment_update": {
      const p = treatmentUpdatePayload.parse(JSON.parse(row.payload));
      const providerId =
        p.input.providerId && p.input.providerId.trim() !== "" ? p.input.providerId.trim() : null;
      const upd = {
        treatment_type: p.input.treatmentType,
        service_type: p.input.serviceType.trim(),
        brand: p.input.brand.trim(),
        treatment_areas: p.input.treatmentAreas,
        units: p.input.units,
        provider_id: providerId,
        treatment_date: new Date(p.input.treatmentDate).toISOString(),
        notes: p.input.notes.trim(),
        cost: p.input.cost,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("treatments")
        .update(upd)
        .eq("id", p.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error("Treatment update skipped (not found).");
      }
      return;
    }
    case "treatment_delete": {
      const p = treatmentDeletePayload.parse(JSON.parse(row.payload));
      const { data, error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", p.id)
        .eq("user_id", userId)
        .select("photo_urls")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        const urls = (data as { photo_urls?: string[] | null }).photo_urls;
        if (urls?.length) {
          try {
            await deleteTreatmentPhotoPaths(supabase, urls);
          } catch {
            /* best-effort */
          }
        }
        await adjustProfileTreatmentCount(supabase, userId, -1);
      }
      return;
    }
    case "provider_create": {
      const p = providerCreatePayload.parse(JSON.parse(row.payload));
      const ins = {
        id: p.clientRowId,
        name: p.input.name.trim(),
        address: p.input.address.trim(),
        city: p.input.city.trim(),
        province: p.input.province.trim(),
        postal_code: p.input.postalCode.trim(),
        phone: p.input.phone.trim(),
        email: p.input.email.trim(),
        website: p.input.website.trim(),
        specialties: p.input.specialties,
        is_verified: false,
        is_global: false,
        user_id: userId,
        created_by: userId,
        is_active: true,
      };
      const { error } = await supabase.from("providers").insert(ins).select("id").maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      return;
    }
    case "provider_update": {
      const p = providerUpdatePayload.parse(JSON.parse(row.payload));
      const upd = {
        name: p.input.name.trim(),
        address: p.input.address.trim(),
        city: p.input.city.trim(),
        province: p.input.province.trim(),
        postal_code: p.input.postalCode.trim(),
        phone: p.input.phone.trim(),
        email: p.input.email.trim(),
        website: p.input.website.trim(),
        specialties: p.input.specialties,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("providers")
        .update(upd)
        .eq("id", p.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error("Provider update skipped (not found).");
      }
      return;
    }
    case "provider_deactivate": {
      const p = providerDeactivatePayload.parse(JSON.parse(row.payload));
      const { data, error } = await supabase
        .from("providers")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", p.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error("Provider deactivate skipped (not found).");
      }
      return;
    }
  }
}

/**
 * Replay pending writes for the signed-in user (FIFO). Clears list caches after each success so next load refetches.
 */
export async function flushWriteOutbox(): Promise<{ processed: number; failed: number }> {
  if (!isSupabaseConfigured()) {
    return { processed: 0, failed: 0 };
  }
  const supabase = getSupabase();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return { processed: 0, failed: 0 };
  }
  const uid = auth.user.id;
  const rows = (await readAllOutboxRows())
    .filter((r) => r.user_id === uid)
    .sort((a, b) => a.created_at - b.created_at);

  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    if (row.attempts >= 5) {
      failed++;
      continue;
    }
    try {
      await executeOutboxRow(row, supabase, uid);
      await removeOutboxRow(row.id);
      processed++;
      await clearTreatmentsListCache(uid);
      await clearProvidersListCache(uid);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await bumpOutboxAttempt(row.id, msg);
      failed++;
    }
  }

  return { processed, failed };
}

/** Serialize create-treatment input for the outbox (ISO date string). */
export function serializeTreatmentCreatePayload(
  clientRowId: string,
  input: {
    treatmentType: "injectable" | "laser";
    serviceType: string;
    brand: string;
    treatmentAreas: string[];
    units: number;
    providerId: string | null;
    treatmentDate: Date;
    notes: string;
    cost: number | null;
    photoUrls?: string[];
  },
): string {
  return JSON.stringify({
    clientRowId,
    input: {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate.toISOString(),
      notes: input.notes,
      cost: input.cost,
      photoUrls: input.photoUrls ?? [],
    },
  });
}

export function serializeTreatmentUpdatePayload(
  id: string,
  input: {
    treatmentType: "injectable" | "laser";
    serviceType: string;
    brand: string;
    treatmentAreas: string[];
    units: number;
    providerId: string | null;
    treatmentDate: Date;
    notes: string;
    cost: number | null;
  },
): string {
  return JSON.stringify({
    id,
    input: {
      treatmentType: input.treatmentType,
      serviceType: input.serviceType,
      brand: input.brand,
      treatmentAreas: input.treatmentAreas,
      units: input.units,
      providerId: input.providerId,
      treatmentDate: input.treatmentDate.toISOString(),
      notes: input.notes,
      cost: input.cost,
    },
  });
}

export function serializeProviderCreatePayload(
  clientRowId: string,
  input: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
    website: string;
    specialties: string[];
  },
): string {
  return JSON.stringify({ clientRowId, input });
}

export function serializeProviderUpdatePayload(
  id: string,
  input: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
    website: string;
    specialties: string[];
  },
): string {
  return JSON.stringify({ id, input });
}
