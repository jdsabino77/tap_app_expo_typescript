import { z } from "zod";
import { type Provider, parseProvider, providerSchema } from "../../domain/provider";
import { kvDelete, kvRead, kvWrite } from "./kv-async";

const listSchema = z.array(providerSchema);

export function providersListCacheKey(userId: string): string {
  return `providers_list:${userId}`;
}

export async function readProvidersListCache(userId: string): Promise<Provider[] | null> {
  const raw = await kvRead(providersListCacheKey(userId));
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

export async function writeProvidersListCache(userId: string, items: Provider[]): Promise<void> {
  await kvWrite(providersListCacheKey(userId), JSON.stringify(items));
}

export async function clearProvidersListCache(userId: string): Promise<void> {
  await kvDelete(providersListCacheKey(userId));
}

export async function patchProvidersListCache(
  userId: string,
  mutate: (current: Provider[]) => Provider[],
): Promise<void> {
  const cur = (await readProvidersListCache(userId)) ?? [];
  await writeProvidersListCache(userId, mutate(cur));
}

export function syntheticProviderFromInput(
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
): Provider {
  return parseProvider({
    id,
    name: input.name.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    isActive: true,
    services: input.specialties,
    isGlobal: false,
  });
}
