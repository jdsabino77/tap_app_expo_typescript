import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Treatment } from "../../src/domain/treatment";
import { formatDisplayDate } from "../../src/lib/datetime";
import {
  fetchTreatmentsForCurrentUser,
  readCachedTreatmentsForCurrentUser,
} from "../../src/repositories/treatment.repository";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

type Section = { title: string; data: Treatment[] };

function groupByDay(treatments: Treatment[]): Section[] {
  const map = new Map<string, Treatment[]>();
  for (const t of treatments) {
    const key = format(t.treatmentDate, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((key) => ({
    title: formatDisplayDate(parseISO(`${key}T12:00:00`)),
    data: (map.get(key) ?? []).sort(
      (a, b) => b.treatmentDate.getTime() - a.treatmentDate.getTime(),
    ),
  }));
}

export default function CalendarScreen() {
  const { supabaseEnabled } = useSession();
  const [items, setItems] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseEnabled) {
      setItems([]);
      setLoading(false);
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
      setError(e instanceof Error ? e.message : "Failed to load");
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

  const sections = useMemo(() => groupByDay(items), [items]);

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Connect Supabase to see treatments by date.</Text>
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
      <Text style={styles.hint}>Treatments grouped by day (read-only list).</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.treatmentType} · {item.serviceType}
            </Text>
            <Text style={styles.cardSub}>{item.brand || "—"}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No treatments to show on the calendar.</Text>}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  err: { color: colors.errorRed, padding: 12 },
  hint: { paddingHorizontal: 16, paddingVertical: 8, color: colors.textSecondary, fontSize: 13 },
  sectionHead: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.primaryNavy },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: colors.cleanWhite,
    borderRadius: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.primaryNavy },
  cardSub: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  empty: { padding: 24, textAlign: "center", color: colors.textSecondary },
});
