import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export type NetworkStatus = "unknown" | "offline" | "online";

function stateToStatus(state: NetInfoState): NetworkStatus {
  if (state.isConnected === false) {
    return "offline";
  }
  const reach = state.isInternetReachable;
  if (reach === false) {
    return "offline";
  }
  if (state.isConnected === true && reach === true) {
    return "online";
  }
  return "unknown";
}

/**
 * Coarse connectivity for “online-first” UX (loading / pending / retry).
 * `isInternetReachable` can be `null` while the OS is checking — surfaces as `unknown`.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>("unknown");

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) {
        setStatus(stateToStatus(state));
      }
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus(stateToStatus(state));
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return status;
}
