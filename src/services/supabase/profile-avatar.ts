import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newUuid } from "../../lib/ids";

export const PROFILE_AVATARS_BUCKET = "profile-avatars";

async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    return res.arrayBuffer();
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decode(base64);
}

function extFromMime(mime?: string): string {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "jpg";
}

/** Storage paths use bucket `profile-avatars` with first folder segment = user id. */
export function isProfileAvatarStoragePath(path: string | null | undefined): boolean {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    return false;
  }
  return path.includes("/");
}

export async function uploadProfileAvatarFile(
  supabase: SupabaseClient,
  userId: string,
  pick: { uri: string; mimeType?: string },
): Promise<string> {
  const buf = await readUriAsArrayBuffer(pick.uri);
  const ext = extFromMime(pick.mimeType);
  const path = `${userId}/avatar-${newUuid()}.${ext}`;
  const { error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).upload(path, buf, {
    contentType: pick.mimeType ?? "image/jpeg",
    upsert: false,
  });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

export async function deleteProfileAvatarPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  const inBucket = paths.filter((p) => isProfileAvatarStoragePath(p));
  if (inBucket.length === 0) {
    return;
  }
  const { error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove(inBucket);
  if (error) {
    throw new Error(error.message);
  }
}

export async function signedUrlForProfileAvatarPath(
  supabase: SupabaseClient,
  path: string,
  expiresSec = 3600,
): Promise<string | null> {
  if (!isProfileAvatarStoragePath(path)) {
    return null;
  }
  const { data, error } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .createSignedUrl(path, expiresSec);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
