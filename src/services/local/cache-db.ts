import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

const DB_NAME = "tap_cache.db";

let opening: Promise<SQLite.SQLiteDatabase | null> | null = null;

/** SQLite KV store for offline cache (native only; web returns null). */
export async function openKvCacheDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") {
    return null;
  }
  if (!opening) {
    opening = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS kv_cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
          CREATE TABLE IF NOT EXISTS write_outbox (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            last_error TEXT
          );
        `);
        return db;
      } catch {
        return null;
      }
    })();
  }
  return opening;
}
