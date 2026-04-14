import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  treatment_count: number | null;
  /** When true, user may manage reference catalogs in-app (RLS `002_reference_catalogs.sql`). */
  is_admin: boolean | null;
  /** Storage path in `profile-avatars` bucket, HTTPS URL, or null. */
  photo_url: string | null;
  created_at: string;
};

function displayNameFromParts(first: string, last: string): string | null {
  const dn = `${first} ${last}`.trim();
  return dn.length > 0 ? dn : null;
}

export async function fetchOwnProfileRow(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return null;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,display_name,treatment_count,is_admin,photo_url,created_at")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as ProfileRow | null;
}

export type UpdateOwnProfileBasicsInput = {
  firstName: string;
  lastName: string;
  /** Pass `null` to clear; `undefined` to leave unchanged. */
  photoUrl?: string | null;
};

export async function updateOwnProfileBasics(input: UpdateOwnProfileBasicsInput): Promise<ProfileRow> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("Not signed in.");
  }
  const fn = input.firstName.trim();
  const ln = input.lastName.trim();
  const patch: Record<string, unknown> = {
    first_name: fn.length > 0 ? fn : null,
    last_name: ln.length > 0 ? ln : null,
    display_name: displayNameFromParts(fn, ln),
    updated_at: new Date().toISOString(),
  };
  if (input.photoUrl !== undefined) {
    patch.photo_url = input.photoUrl;
  }
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", auth.user.id)
    .select("id,email,first_name,last_name,display_name,treatment_count,is_admin,photo_url,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as ProfileRow;
}
