import { z } from "zod";

/**
 * User-facing provider (Flutter `Provider` model).
 * Firestore stores service tags as `specialties`; UI maps them to `services`.
 */
export const providerSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string().default(""),
  isActive: z.boolean().default(true),
  services: z.array(z.string()).default([]),
  isGlobal: z.boolean().default(true),
});

export type Provider = z.infer<typeof providerSchema>;

export function parseProvider(input: unknown): Provider {
  return providerSchema.parse(input);
}

/** Normalize a remote document (Firestore / Supabase) into `Provider`. */
export function providerFromRemote(
  id: string,
  raw: Record<string, unknown>,
): Provider {
  const specialties = raw.specialties;
  const services = raw.services;
  const list = Array.isArray(specialties)
    ? specialties
    : Array.isArray(services)
      ? services
      : [];

  const postal =
    typeof raw.postal_code === "string"
      ? raw.postal_code
      : typeof raw.postalCode === "string"
        ? raw.postalCode
        : "";

  return parseProvider({
    id,
    name: raw.name ?? "",
    address: raw.address ?? "",
    city: raw.city ?? "",
    province: raw.province ?? "",
    postalCode: postal,
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    website: typeof raw.website === "string" ? raw.website : "",
    isActive:
      typeof raw.is_active === "boolean"
        ? raw.is_active
        : typeof raw.isActive === "boolean"
          ? raw.isActive
          : true,
    services: list.map(String),
    isGlobal:
      typeof raw.is_global === "boolean"
        ? raw.is_global
        : typeof raw.isGlobal === "boolean"
          ? raw.isGlobal
          : true,
  });
}

export function providerFullAddress(p: Pick<Provider, "address" | "city" | "province" | "postalCode">): string {
  return `${p.address}, ${p.city}, ${p.province} ${p.postalCode}`;
}
