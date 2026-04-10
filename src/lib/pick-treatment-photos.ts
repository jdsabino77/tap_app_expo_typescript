import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";
import { appStrings } from "../strings/appStrings";
import { MAX_TREATMENT_PHOTOS } from "../services/supabase/treatment-photos";

export async function pickTreatmentImages(
  currentCount: number,
): Promise<{ uri: string; mimeType?: string }[]> {
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
  });
  if (res.canceled) {
    return [];
  }
  return res.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? undefined }));
}
