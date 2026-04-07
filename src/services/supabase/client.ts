import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function getExtra(): Extra {
  const ex = Constants.expoConfig?.extra as Extra | undefined;
  return ex ?? {};
}

/** URL + anon key from `app.config.js` → `extra`, then `EXPO_PUBLIC_*` env (if set). */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const extra = getExtra();
  const url =
    (typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : "") ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "";
  const anonKey =
    (typeof extra.supabaseAnonKey === "string" ? extra.supabaseAnonKey : "") ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

const memoryFallback = new Map<string, string>();

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch {
      /* ignore */
    }
    return memoryFallback.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      /* ignore */
    }
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
        return;
      }
    } catch {
      /* ignore */
    }
    memoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

let client: SupabaseClient | null = null;
let clientKey = "";

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set extra.supabaseUrl and extra.supabaseAnonKey in app.config.js, add supabase.local.json, or use EXPO_PUBLIC_* env vars.",
    );
  }
  const { url, anonKey } = getSupabaseCredentials();
  const pair = `${url}|${anonKey}`;
  if (!client || clientKey !== pair) {
    clientKey = pair;
    client = createClient(url, anonKey, {
      auth: {
        storage: {
          getItem: storageGet,
          setItem: storageSet,
          removeItem: storageRemove,
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
