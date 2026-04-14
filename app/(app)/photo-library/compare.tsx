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

/** ~5% inset on each side → photos use ~90% of width and height. */
const FRAME_INSET_FRAC = 0.05;
const CELL_GAP = 4;

type CellSpec = { w: number; h: number };

/** Tile size is fixed (~90% layout); image uses `contain` so aspect ratio matches the file (letterboxing in tile as needed). */
function PhotoPane({
  uri,
  date,
  cell,
}: {
  uri: string;
  date: Date;
  cell: CellSpec;
}) {
  return (
    <View style={[styles.pane, { width: cell.w, height: cell.h }]}>
      <View style={[styles.paneImageWrap, { width: cell.w, height: cell.h }]}>
        <ZoomableImage uri={uri} width={cell.w} height={cell.h} resizeMode="contain" />
        <View style={styles.dateOverlay} pointerEvents="none">
          <Text style={styles.dateOverlayText} numberOfLines={1}>
            {formatDisplayDate(date)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Pixel-perfect grid; date sits on the image (overlay), so cell height is all image. */
function CompareGrid({
  resolved,
  innerW,
  innerH,
}: {
  resolved: Resolved[];
  innerW: number;
  innerH: number;
}) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const count = resolved.length;

  const cells = useMemo((): CellSpec[] => {
    if (innerW < 1 || innerH < 1) {
      return [];
    }
    const g = CELL_GAP;

    if (count === 1) {
      return [{ w: Math.floor(innerW), h: Math.max(80, Math.floor(innerH)) }];
    }

    if (count === 2) {
      const cw = Math.floor((innerW - g) / 2);
      const ch = Math.max(80, Math.floor(innerH));
      return [{ w: cw, h: ch }, { w: cw, h: ch }];
    }

    if (count === 3) {
      const cw = Math.floor((innerW - 2 * g) / 3);
      const ch = Math.max(80, Math.floor(innerH));
      return [{ w: cw, h: ch }, { w: cw, h: ch }, { w: cw, h: ch }];
    }

    // count === 4
    if (landscape) {
      const cw = Math.floor((innerW - 3 * g) / 4);
      const ch = Math.max(80, Math.floor(innerH));
      return [
        { w: cw, h: ch },
        { w: cw, h: ch },
        { w: cw, h: ch },
        { w: cw, h: ch },
      ];
    }

    const cw = Math.floor((innerW - g) / 2);
    const rowH = Math.max(0, (innerH - g) / 2);
    const ch = Math.floor(rowH);
    return [
      { w: cw, h: ch },
      { w: cw, h: ch },
      { w: cw, h: ch },
      { w: cw, h: ch },
    ];
  }, [count, innerW, innerH, landscape]);

  if (cells.length !== count) {
    return null;
  }

  const gridBox = { width: innerW, height: innerH };

  if (count === 1) {
    return (
      <View style={[styles.gridBox, gridBox]}>
        <PhotoPane uri={resolved[0].uri} date={resolved[0].date} cell={cells[0]} />
      </View>
    );
  }

  if (count === 2) {
    return (
      <View style={[styles.gridBox, styles.row, gridBox]}>
        <PhotoPane uri={resolved[0].uri} date={resolved[0].date} cell={cells[0]} />
        <PhotoPane uri={resolved[1].uri} date={resolved[1].date} cell={cells[1]} />
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={[styles.gridBox, styles.row, gridBox]}>
        <PhotoPane uri={resolved[0].uri} date={resolved[0].date} cell={cells[0]} />
        <PhotoPane uri={resolved[1].uri} date={resolved[1].date} cell={cells[1]} />
        <PhotoPane uri={resolved[2].uri} date={resolved[2].date} cell={cells[2]} />
      </View>
    );
  }

  if (landscape) {
    return (
      <View style={[styles.gridBox, styles.row, gridBox]}>
        <PhotoPane uri={resolved[0].uri} date={resolved[0].date} cell={cells[0]} />
        <PhotoPane uri={resolved[1].uri} date={resolved[1].date} cell={cells[1]} />
        <PhotoPane uri={resolved[2].uri} date={resolved[2].date} cell={cells[2]} />
        <PhotoPane uri={resolved[3].uri} date={resolved[3].date} cell={cells[3]} />
      </View>
    );
  }

  return (
    <View style={[styles.gridBox, gridBox, styles.colTwoByTwo]}>
      <View style={[styles.row, { width: innerW, gap: CELL_GAP }]}>
        <PhotoPane uri={resolved[0].uri} date={resolved[0].date} cell={cells[0]} />
        <PhotoPane uri={resolved[1].uri} date={resolved[1].date} cell={cells[1]} />
      </View>
      <View style={[styles.row, { width: innerW, gap: CELL_GAP }]}>
        <PhotoPane uri={resolved[2].uri} date={resolved[2].date} cell={cells[2]} />
        <PhotoPane uri={resolved[3].uri} date={resolved[3].date} cell={cells[3]} />
      </View>
    </View>
  );
}

export default function PhotoCompareScreen() {
  const { items: itemsParam } = useLocalSearchParams<{ items?: string }>();
  const { supabaseEnabled } = useSession();
  const insets = useSafeAreaInsets();
  const [resolved, setResolved] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [layout, setLayout] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const selection = useMemo(() => decodeCompareSelection(itemsParam), [itemsParam]);

  const innerFrame = useMemo(() => {
    const { w, h } = layout;
    if (w < 1 || h < 1) {
      return { innerW: 0, innerH: 0 };
    }
    const padW = w * FRAME_INSET_FRAC;
    const padH = h * FRAME_INSET_FRAC;
    return {
      innerW: Math.floor(w - 2 * padW),
      innerH: Math.floor(h - 2 * padH),
    };
  }, [layout]);

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
        const out: Resolved[] = paths
          .map((_, i) => ({
            uri: urls[i] ?? "",
            date: dates[i] ?? new Date(),
          }))
          .filter((x) => x.uri.length > 0);
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

  const padW = layout.w * FRAME_INSET_FRAC;
  const padH = layout.h * FRAME_INSET_FRAC;

  return (
    <GestureHandlerRootView
      style={[styles.flex, { paddingBottom: Math.max(insets.bottom, 10) }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setLayout({ w: width, h: height });
        }
      }}
    >
      {innerFrame.innerW > 0 && innerFrame.innerH > 0 ? (
        <View
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            paddingHorizontal: padW,
            paddingTop: padH,
            paddingBottom: padH,
          }}
        >
          <CompareGrid resolved={resolved} innerW={innerFrame.innerW} innerH={innerFrame.innerH} />
        </View>
      ) : null}
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
  gridBox: {
    minWidth: 0,
    minHeight: 0,
    gap: CELL_GAP,
    justifyContent: "center",
    alignItems: "center",
  },
  colTwoByTwo: {
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  row: {
    flexDirection: "row",
    minWidth: 0,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  pane: {
    flexShrink: 0,
    overflow: "hidden",
  },
  paneImageWrap: {
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  dateOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dateOverlayText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
  },
});
