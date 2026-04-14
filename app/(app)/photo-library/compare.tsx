import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ZoomableImage } from "../../../src/components/zoomable-image";
import { formatDisplayDate } from "../../../src/lib/datetime";
import { decodeCompareSelection } from "../../../src/lib/photo-library";
import {
  fetchTreatmentPhotoSignedUrls,
  fetchTreatmentsForCurrentUser,
} from "../../../src/repositories/treatment.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

type Resolved = { uri: string; date: Date };

export default function PhotoCompareScreen() {
  const { items: itemsParam } = useLocalSearchParams<{ items?: string }>();
  const { supabaseEnabled } = useSession();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [resolved, setResolved] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const selection = useMemo(() => decodeCompareSelection(itemsParam), [itemsParam]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch {
          /* web / unsupported */
        }
      })();
      return () => {
        void (async () => {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } catch {
            /* ignore */
          }
        })();
      };
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!supabaseEnabled || selection.length === 0) {
        setResolved([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const treatments = await fetchTreatmentsForCurrentUser();
        if (cancelled) {
          return;
        }
        const paths: string[] = [];
        const dates: Date[] = [];
        for (const sel of selection) {
          const t = treatments.find((x) => x.id === sel.treatmentId);
          const path = t?.photoUrls[sel.pathIndex];
          if (!path || !t) {
            continue;
          }
          paths.push(path);
          dates.push(t.photoCapturedAt[sel.pathIndex] ?? t.treatmentDate);
        }
        if (paths.length === 0) {
          setResolved([]);
          setLoading(false);
          return;
        }
        const urls = await fetchTreatmentPhotoSignedUrls(paths);
        const out: Resolved[] = paths.map((_, i) => ({
          uri: urls[i] ?? "",
          date: dates[i] ?? new Date(),
        })).filter((x) => x.uri.length > 0);
        setResolved(out);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not load photos.");
          setResolved([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, selection]);

  const layout = useMemo(() => {
    const count = resolved.length;
    if (count === 0) {
      return { cellW: 0, cellH: 0 };
    }
    const isLandscape = width > height;
    const colCount = count === 1 ? 1 : isLandscape && count >= 4 ? 4 : 2;
    const rowCount = Math.ceil(count / colCount);
    const pad = 8;
    const innerW = width - pad * 2;
    const innerH = height - insets.top - insets.bottom - pad * 2 - 56;
    const cellW = Math.floor(innerW / colCount) - pad;
    const cellH = Math.max(140, Math.floor(innerH / rowCount) - 36);
    return { cellW, cellH };
  }, [resolved.length, width, height, insets.top, insets.bottom]);

  if (!supabaseEnabled) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Connect Supabase to compare photos.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primaryNavy} />
      </View>
    );
  }

  if (err) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{err}</Text>
      </View>
    );
  }

  if (resolved.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No photos to compare.</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={[styles.grid, { paddingBottom: insets.bottom + 8 }]}>
        {resolved.map((item, i) => (
          <View
            key={`${item.uri}-${i}`}
            style={[
              styles.cell,
              {
                width: layout.cellW + 8,
                minHeight: layout.cellH + 40,
              },
            ]}
          >
            <ZoomableImage uri={item.uri} width={layout.cellW} height={layout.cellH} />
            <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>
          </View>
        ))}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.lightGray,
  },
  muted: { color: colors.textSecondary, textAlign: "center" },
  err: { color: colors.errorRed },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "center",
    paddingHorizontal: 8,
  },
  cell: {
    margin: 4,
    alignItems: "center",
    backgroundColor: colors.cleanWhite,
    borderRadius: 10,
    padding: 4,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
