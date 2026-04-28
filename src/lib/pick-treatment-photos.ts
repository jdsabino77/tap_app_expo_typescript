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

export type TreatmentPhotoSource = "library" | "camera";

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

function openPermissionsAlert(title: string, body: string) {
  Alert.alert(title, body, [
    { text: "Cancel", style: "cancel" },
    { text: appStrings.photoPermissionOpenSettings, onPress: () => void Linking.openSettings() },
  ]);
}

export async function pickTreatmentImages(
  currentCount: number,
  source: TreatmentPhotoSource = "library",
): Promise<TreatmentPhotoPick[]> {
  const remaining = MAX_TREATMENT_PHOTOS - currentCount;
  if (remaining <= 0) {
    return [];
  }

  const res =
    source === "camera"
      ? await (async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            openPermissionsAlert(
              appStrings.cameraPermissionDeniedTitle,
              appStrings.cameraPermissionDeniedMessage,
            );
            return { canceled: true, assets: null };
          }
          return ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            exif: true,
          });
        })()
      : await (async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            openPermissionsAlert(
              appStrings.photoPermissionDeniedTitle,
              appStrings.photoPermissionDeniedMessage,
            );
            return { canceled: true, assets: null };
          }
          return ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.85,
            exif: true,
          });
        })();

  if (res.canceled) {
    return [];
  }
  const assets = res.assets ?? [];
  return assets.map((a) => ({
    uri: a.uri,
    mimeType: a.mimeType ?? undefined,
    capturedAt: capturedAtFromAsset(a),
  }));
}
