import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Platform } from "react-native";
import { appStrings } from "../strings/appStrings";
import { MAX_TREATMENT_PHOTOS } from "../services/supabase/treatment-photos";

export type TreatmentPhotoPick = {
  uri: string;
  mimeType?: string;
  /** From EXIF / file metadata when available; otherwise set at save time. */
  capturedAt?: Date;
};

/** Parses EXIF DateTime / DateTimeOriginal (e.g. "2024:03:15 14:30:00"). */
function parseExifDateTime(exif: Record<string, unknown> | null | undefined): Date | undefined {
  if (!exif) {
    return undefined;
  }
  const raw = exif.DateTimeOriginal ?? exif.DateTime;
  if (typeof raw !== "string") {
    return undefined;
  }
  const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function capturedAtFromAsset(a: ImagePicker.ImagePickerAsset): Date | undefined {
  const fromExif = parseExifDateTime(a.exif ?? undefined);
  if (fromExif) {
    return fromExif;
  }
  if (Platform.OS === "web" && a.file && typeof a.file.lastModified === "number") {
    return new Date(a.file.lastModified);
  }
  return undefined;
}

export async function pickTreatmentImages(currentCount: number): Promise<TreatmentPhotoPick[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(appStrings.photoPermissionDeniedTitle, appStrings.photoPermissionDeniedMessage, [
      { text: "Cancel", style: "cancel" },
      { text: appStrings.photoPermissionOpenSettings, onPress: () => void Linking.openSettings() },
    ]);
    return [];
  }
  const remaining = MAX_TREATMENT_PHOTOS - currentCount;
  if (remaining <= 0) {
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.85,
    exif: true,
  });
  if (res.canceled) {
    return [];
  }
  return res.assets.map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? undefined,
    capturedAt: capturedAtFromAsset(a),
  }));
}
