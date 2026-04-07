import { v4 as uuidv4 } from "uuid";

/**
 * Client-generated IDs (Firestore doc ids, optimistic SQLite keys, etc.).
 * Sync `uuid` matches typical Flutter `uuid` package usage.
 */
export function newUuid(): string {
  return uuidv4();
}
