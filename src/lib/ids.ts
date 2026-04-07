import * as Crypto from "expo-crypto";

/**
 * Client-generated IDs (Firestore doc ids, optimistic SQLite keys, outbox rows, etc.).
 * Uses `expo-crypto` so Metro/React Native can bundle without the `uuid` package (its package.json
 * `exports` are not resolved the same way as Node/tsc).
 */
export function newUuid(): string {
  return Crypto.randomUUID();
}
