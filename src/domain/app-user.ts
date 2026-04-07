import { z } from "zod";

/**
 * App profile row (Flutter `users/{uid}` Firestore document + auth metadata).
 * Supabase: typically `public.profiles` keyed by `id` = `auth.users.id`.
 */
export const appUserProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  treatmentCount: z.number().int().nonnegative().optional(),
  isAdmin: z.boolean().default(false),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  lastLoginAt: z.coerce.date().optional(),
});

export type AppUserProfile = z.infer<typeof appUserProfileSchema>;

export function parseAppUserProfile(input: unknown): AppUserProfile {
  return appUserProfileSchema.parse(input);
}
