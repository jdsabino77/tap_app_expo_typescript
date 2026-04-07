import { Platform } from "react-native";
import { openKvCacheDb } from "./cache-db";

const WEB_PREFIX = "tap_kv_";

export async function kvRead(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(WEB_PREFIX + key);
      }
    } catch {
      /* ignore */
    }
    return null;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return null;
  }
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM kv_cache WHERE key = ?",
      [key],
    );
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export async function kvWrite(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(WEB_PREFIX + key, value);
      }
    } catch {
      /* ignore */
    }
    return;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return;
  }
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO kv_cache (key, value, updated_at) VALUES (?, ?, ?)",
      [key, value, Date.now()],
    );
  } catch {
    /* ignore */
  }
}

export async function kvDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(WEB_PREFIX + key);
      }
    } catch {
      /* ignore */
    }
    return;
  }
  const db = await openKvCacheDb();
  if (!db) {
    return;
  }
  try {
    await db.runAsync("DELETE FROM kv_cache WHERE key = ?", [key]);
  } catch {
    /* ignore */
  }
}
