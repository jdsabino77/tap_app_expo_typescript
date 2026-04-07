import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  treatment_count: number | null;
};

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
    .select("id,email,first_name,last_name,display_name,treatment_count")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as ProfileRow | null;
}
