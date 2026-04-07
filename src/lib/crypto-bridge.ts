import * as Crypto from "expo-crypto";

/** CSPRNG UUID via native bridge — use for sensitive tokens (kept out of `ids.ts` so Vitest stays Node-only). */
export async function newSecureUuid(): Promise<string> {
  return Crypto.randomUUID();
}
