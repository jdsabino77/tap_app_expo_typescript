import { useFocusEffect } from "@react-navigation/native";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Treatment } from "../../../src/domain/treatment";
import { formatDisplayDate } from "../../../src/lib/datetime";
import {
  filterTreatmentsByListSelections,
  distinctSortedSubtypeKeys,
  TREATMENT_SUBTYPE_NONE,
} from "../../../src/lib/treatment-list-filter";
import {
  treatmentServiceLine,
  treatmentTypeDisplayLabel,
} from "../../../src/lib/treatment-service-line";
import {
  fetchTreatmentsForCurrentUser,
  readCachedTreatmentsForCurrentUser,
} from "../../../src/repositories/treatment.repository";
import {
  defaultTreatmentsListFilterState,
  readTreatmentsListFilterPrefs,
  writeTreatmentsListFilterPrefs,
} from "../../../src/services/local/list-filter-preferences";
import { appStrings } from "../../../src/strings/appStrings";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

const ebdLineLabels = {
  laserModality: appStrings.ebdModalityLaser,
  photofacialModality: appStrings.ebdModalityPhotofacial,
};

const TREATMENT_TYPE_SLUGS = ["injectable", "laser", "skin_treatments"] as const;

function toggleInList(list: string[], value: string): string[] {
  if (list.includes(value)) {
    return list.filter((x) => x !== value);
  }
  return [...list, value];
}

function typeLabelForSlug(slug: string): string {
  if (slug === "injectable") {
    return appStrings.treatmentTypeInjectableLabel;
  }
  if (slug === "laser") {
    return appStrings.treatmentTypeEnergyBasedDevicesLabel;
  }
  if (slug === "skin_treatments") {
    return appStrings.treatmentTypeSkinTreatmentsLabel;
  }
  return slug;
}

function subtypeDisplayLabel(key: string): string {
  if (key === TREATMENT_SUBTYPE_NONE) {
    return appStrings.filterSubtypeUnspecified;
  }
  return key;
}

export default function TreatmentListScreen() {
  const { supabaseEnabled, userId } = useSession();
  const [items, setItems] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState(defaultTreatmentsListFilterState);
  const [treatmentPrefsHydrated, setTreatmentPrefsHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setTreatmentPrefsHydrated(false);
      return;
    }
    let cancel = false;
    setTreatmentPrefsHydrated(false);
    void readTreatmentsListFilterPrefs(userId).then((s) => {
      if (!cancel) {
        setListFilter(s);
        setTreatmentPrefsHydrated(true);
      }
    });
    return () => {
      cancel = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !treatmentPrefsHydrated) {
      return;
    }
    const t = setTimeout(() => {
      void writeTreatmentsListFilterPrefs(userId, listFilter);
    }, 300);
    return () => clearTimeout(t);
  }, [userId, treatmentPrefsHydrated, listFilter]);

  const load = useCallback(async () => {
    if (!supabaseEnabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setError(null);
      const cached = await readCachedTreatmentsForCurrentUser();
      if (cached != null) {
        setItems(cached);
      }
      const rows = await fetchTreatmentsForCurrentUser();
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load treatments");
      const stale = await readCachedTreatmentsForCurrentUser();
      setItems(stale ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const subtypeOptions = useMemo(() => distinctSortedSubtypeKeys(items), [items]);

  const filteredItems = useMemo(
    () => filterTreatmentsByListSelections(items, listFilter.treatmentTypeSlugs, listFilter.subtypeKeys),
    [items, listFilter],
  );

  const filtersActive =
    listFilter.treatmentTypeSlugs.length > 0 || listFilter.subtypeKeys.length > 0;

  const clearFilters = useCallback(() => {
    setListFilter(defaultTreatmentsListFilterState);
  }, []);

  if (!supabaseEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.p}>Connect Supabase to load treatments. Stub links:</Text>
        <Link href="/treatments/new" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>New treatment</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {error ? <Text style={styles.err}>{error}</Text> : null}

      <View style={styles.filterSection}>
        <Text style={styles.filterHeading}>{appStrings.filterTreatmentTypesLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {TREATMENT_TYPE_SLUGS.map((slug) => {
            const selected = listFilter.treatmentTypeSlugs.includes(slug);
            return (
              <Pressable
                key={slug}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() =>
                  setListFilter((prev) => ({
                    ...prev,
                    treatmentTypeSlugs: toggleInList(prev.treatmentTypeSlugs, slug),
                  }))
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={2}>
                  {typeLabelForSlug(slug)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {subtypeOptions.length > 0 ? (
          <>
            <Text style={[styles.filterHeading, { marginTop: 8 }]}>{appStrings.filterServiceSubtypeLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {subtypeOptions.map((key) => {
                const selected = listFilter.subtypeKeys.includes(key);
                return (
                  <Pressable
                    key={key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() =>
                      setListFilter((prev) => ({
                        ...prev,
                        subtypeKeys: toggleInList(prev.subtypeKeys, key),
                      }))
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                      numberOfLines={2}
                    >
                      {subtypeDisplayLabel(key)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {filtersActive ? (
          <View style={styles.activeRow}>
            <Text style={styles.activeText} numberOfLines={3}>
              {appStrings.filterActivePrefix}{" "}
              {[
                ...listFilter.treatmentTypeSlugs.map(typeLabelForSlug),
                ...listFilter.subtypeKeys.map(subtypeDisplayLabel),
              ].join(" · ")}
            </Text>
            <Pressable onPress={clearFilters} accessibilityRole="button">
              <Text style={styles.clearLink}>{appStrings.filterClear}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {items.length === 0
              ? "No treatments yet. Add one to mirror Flutter list."
              : appStrings.filterTreatmentsNoMatches}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/treatments/${item.id}`)}
          >
            <Text style={styles.cardTitle}>
              {treatmentTypeDisplayLabel(item.treatmentType)} · {treatmentServiceLine(item, ebdLineLabels)}
            </Text>
            <Text style={styles.cardSub}>{formatDisplayDate(item.treatmentDate)}</Text>
            <Text style={styles.cardSub}>{item.brand || "—"}</Text>
          </Pressable>
        )}
      />
      <Link href="/treatments/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+ New</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  container: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  p: { color: colors.textSecondary, marginBottom: 16 },
  err: { color: colors.errorRed, padding: 12 },
  empty: { padding: 24, color: colors.textSecondary, textAlign: "center" },
  filterSection: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  filterHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.primaryNavy },
  chipTextSelected: { color: colors.cleanWhite },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  activeText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  clearLink: { fontSize: 13, fontWeight: "600", color: colors.infoBlue },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy },
  cardSub: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  btn: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  btnText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: colors.primaryGold,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
  },
  fabText: { color: colors.primaryNavy, fontWeight: "700" },
});
