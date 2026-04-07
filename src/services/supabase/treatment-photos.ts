import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newUuid } from "../../lib/ids";

export const TREATMENT_PHOTOS_BUCKET = "treatment-photos";

/** Cap per treatment to keep uploads and UI predictable. */
export const MAX_TREATMENT_PHOTOS = 6;

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

export async function uploadTreatmentPhotoFiles(
  supabase: SupabaseClient,
  userId: string,
  treatmentId: string,
  picks: { uri: string; mimeType?: string }[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const pick of picks) {
    const buf = await readUriAsArrayBuffer(pick.uri);
    const ext = extFromMime(pick.mimeType);
    const path = `${userId}/${treatmentId}/${newUuid()}.${ext}`;
    const { error } = await supabase.storage.from(TREATMENT_PHOTOS_BUCKET).upload(path, buf, {
      contentType: pick.mimeType ?? "image/jpeg",
      upsert: false,
    });
    if (error) {
      throw new Error(error.message);
    }
    paths.push(path);
  }
  return paths;
}

export async function deleteTreatmentPhotoPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }
  const { error } = await supabase.storage.from(TREATMENT_PHOTOS_BUCKET).remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}

export async function signedUrlsForTreatmentPhotoPaths(
  supabase: SupabaseClient,
  paths: string[],
  expiresSec = 3600,
): Promise<string[]> {
  const out: string[] = [];
  for (const p of paths) {
    const { data, error } = await supabase.storage
      .from(TREATMENT_PHOTOS_BUCKET)
      .createSignedUrl(p, expiresSec);
    if (!error && data?.signedUrl) {
      out.push(data.signedUrl);
    }
  }
  return out;
}
