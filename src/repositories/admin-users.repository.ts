import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type AdminUserProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean | null;
};

export async function adminListUserProfiles(): Promise<AdminUserProfileRow[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("Not signed in.");
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,is_admin")
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as AdminUserProfileRow[];
}

export async function adminSetUserIsAdmin(userId: string, isAdmin: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_set_user_admin", {
    p_user_id: userId,
    p_is_admin: isAdmin,
  });
  if (error) {
    throw new Error(error.message);
  }
}
