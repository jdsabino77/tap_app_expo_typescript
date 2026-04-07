import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { parseAuthTokensFromUrl } from "./auth-url-tokens";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

type Extra = { authEmailRedirectUrl?: string };

/**
 * Where Supabase should send the user after they tap **Confirm email** (and similar links).
 * Must be listed under Supabase → Authentication → URL Configuration → **Redirect URLs**.
 *
 * Priority: `extra.authEmailRedirectUrl` → `EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL` →
 * `Linking.createURL('/auth/callback')` (stable for dev/prod **builds** with `expo.scheme`; **Expo Go** URLs are often unstable — set the env var to an explicit `exp://…` URL from one run, or disable email confirmation for local testing).
 */
export function getAuthEmailRedirectUri(): string {
  const ex = Constants.expoConfig?.extra as Extra | undefined;
  const fromExtra =
    typeof ex?.authEmailRedirectUrl === "string" ? ex.authEmailRedirectUrl.trim() : "";
  if (fromExtra) {
    return fromExtra;
  }
  const fromEnv =
    typeof process.env.EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL === "string"
      ? process.env.EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL.trim()
      : "";
  if (fromEnv) {
    return fromEnv;
  }
  return Linking.createURL("/auth/callback");
}

export async function applySupabaseAuthFromUrl(url: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  const tokens = parseAuthTokensFromUrl(url);
  if (!tokens) {
    return false;
  }
  const { error } = await getSupabase().auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  return error == null;
}
