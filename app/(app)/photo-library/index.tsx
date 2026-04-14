import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDisplayDate } from "../../../src/lib/datetime";
import {
  encodeCompareSelection,
  flattenTreatmentPhotosForLibrary,
  type PhotoLibraryFlatItem,
} from "../../../src/lib/photo-library";
import {
  fetchTreatmentPhotoSignedUrls,
  fetchTreatmentsForCurrentUser,
} from "../../../src/repositories/treatment.repository";
import { appStrings } from "../../../src/strings/appStrings";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

function selectionKey(item: PhotoLibraryFlatItem): string {
  return `${item.treatmentId}:${item.pathIndex}`;
}

type Row = PhotoLibraryFlatItem & { signedUrl: string | null };

export default function PhotoLibraryScreen() {
  const { supabaseEnabled } = useSession();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PhotoLibraryFlatItem[]>([]);

  const thumbSize = useMemo(() => Math.floor((width - 16 * 3) / 2), [width]);

  const load = useCallback(async () => {
    if (!supabaseEnabled) {
      setRows([]);
      setLoading(false);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const treatments = await fetchTreatmentsForCurrentUser();
      const flat = flattenTreatmentPhotosForLibrary(treatments);
      if (flat.length === 0) {
        setRows([]);
        return;
      }
      const paths = flat.map((f) => f.storagePath);
      const signed = await fetchTreatmentPhotoSignedUrls(paths);
      const merged: Row[] = flat.map((f, i) => ({
        ...f,
        signedUrl: signed[i] ?? null,
      }));
      setRows(merged);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load photos.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedKeys = useMemo(
    () => new Set(selectedOrder.map((x) => selectionKey(x))),
    [selectedOrder],
  );

  const toggle = useCallback((item: PhotoLibraryFlatItem) => {
    setSelectedOrder((prev) => {
      const k = selectionKey(item);
      const idx = prev.findIndex((x) => selectionKey(x) === k);
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const onCompare = useCallback(() => {
    if (selectedOrder.length === 0) {
      return;
    }
    router.push({
      pathname: "/photo-library/compare",
      params: {
        items: encodeCompareSelection(
          selectedOrder.map((x) => ({ treatmentId: x.treatmentId, pathIndex: x.pathIndex })),
        ),
      },
    });
  }, [selectedOrder]);

  if (!supabaseEnabled) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Connect Supabase to view photos.</Text>
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

  if (rows.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{appStrings.photoLibraryEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={rows}
        keyExtractor={(item) => selectionKey(item)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const selected = selectedKeys.has(selectionKey(item));
          return (
            <Pressable
              onPress={() => toggle(item)}
              style={[
                styles.cell,
                { width: thumbSize },
                selected && styles.cellSelected,
              ]}
            >
              {item.signedUrl ? (
                <Image source={{ uri: item.signedUrl }} style={[styles.thumb, { height: thumbSize }]} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder, { height: thumbSize }]} />
              )}
              <Text style={styles.dateLabel} numberOfLines={1}>
                {formatDisplayDate(item.sortDate)}
              </Text>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>{selectedOrder.findIndex((x) => selectionKey(x) === selectionKey(item)) + 1}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.footerMeta}>{appStrings.photoLibrarySelectionCount(selectedOrder.length)}</Text>
        <Pressable
          style={[styles.compareBtn, selectedOrder.length === 0 && styles.compareBtnDisabled]}
          onPress={onCompare}
          disabled={selectedOrder.length === 0}
        >
          <Text style={styles.compareBtnText}>{appStrings.photoLibraryCompareCta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  centered: {
    flex: 1,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  muted: { color: colors.textSecondary, textAlign: "center" },
  err: { color: colors.errorRed, textAlign: "center" },
  listContent: { padding: 16, paddingBottom: 8 },
  columnWrap: { justifyContent: "space-between", marginBottom: 12 },
  cell: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.cleanWhite,
    padding: 4,
  },
  cellSelected: {
    borderWidth: 3,
    borderColor: colors.primaryGold,
  },
  thumb: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: colors.borderSubtle,
  },
  thumbPlaceholder: { opacity: 0.4 },
  dateLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryGold,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeText: { fontSize: 14, fontWeight: "700", color: colors.primaryNavy },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderMuted,
    backgroundColor: colors.cleanWhite,
  },
  footerMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  compareBtn: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  compareBtnDisabled: { opacity: 0.45 },
  compareBtnText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
});
