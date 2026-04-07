import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

/** True when the device appears disconnected (coarse; same signals as `useNetworkStatus`). */
export async function isDeviceOffline(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return true;
    }
    return false;
  }
  const s = await NetInfo.fetch();
  if (s.isConnected === false) {
    return true;
  }
  if (s.isInternetReachable === false) {
    return true;
  }
  return false;
}
