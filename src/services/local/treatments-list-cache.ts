import { z } from "zod";
import { type Treatment, parseTreatment, treatmentSchema } from "../../domain/treatment";
import { kvDelete, kvRead, kvWrite } from "./kv-async";

const listSchema = z.array(treatmentSchema);

export function treatmentsListCacheKey(userId: string): string {
  return `treatments_list:${userId}`;
}

export async function readTreatmentsListCache(userId: string): Promise<Treatment[] | null> {
  const raw = await kvRead(treatmentsListCacheKey(userId));
  if (!raw) {
    return null;
  }
  try {
    const data: unknown = JSON.parse(raw);
    const r = listSchema.safeParse(data);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export async function writeTreatmentsListCache(userId: string, items: Treatment[]): Promise<void> {
  await kvWrite(treatmentsListCacheKey(userId), JSON.stringify(items));
}

export async function clearTreatmentsListCache(userId: string): Promise<void> {
  await kvDelete(treatmentsListCacheKey(userId));
}

/** Merge offline-queued rows into the cached list (prepend / replace / filter). */
export async function patchTreatmentsListCache(
  userId: string,
  mutate: (current: Treatment[]) => Treatment[],
): Promise<void> {
  const cur = (await readTreatmentsListCache(userId)) ?? [];
  await writeTreatmentsListCache(userId, mutate(cur));
}

export function syntheticTreatmentFromInput(
  id: string,
  userId: string,
  input: {
    treatmentType: Treatment["treatmentType"];
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
): Treatment {
  return parseTreatment({
    id,
    userId,
    treatmentType: input.treatmentType,
    serviceType: input.serviceType.trim(),
    brand: input.brand.trim(),
    treatmentAreas: input.treatmentAreas,
    units: input.units,
    providerId: input.providerId && input.providerId.trim() !== "" ? input.providerId.trim() : "",
    treatmentDate: input.treatmentDate,
    notes: input.notes.trim(),
    cost: input.cost,
    photoUrls: input.photoUrls ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
