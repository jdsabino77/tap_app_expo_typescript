import { useEffect } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { flushWriteOutbox } from "../services/local/write-queue";
import { useSession } from "../store/session";

/** When the app is online and signed in, replays pending outbox writes (FIFO). */
export function WriteQueueSync(): null {
  const net = useNetworkStatus();
  const { supabaseEnabled, userId } = useSession();

  useEffect(() => {
    if (!supabaseEnabled || !userId || net !== "online") {
      return;
    }
    void flushWriteOutbox();
  }, [supabaseEnabled, userId, net]);

  return null;
}
