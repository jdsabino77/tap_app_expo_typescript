import { useFocusEffect } from "@react-navigation/native";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatDisplayDate } from "../../../src/lib/datetime";
import {
  treatmentServiceLine,
  treatmentTypeDisplayLabel,
} from "../../../src/lib/treatment-service-line";
import { appStrings } from "../../../src/strings/appStrings";
import {
  fetchTreatmentsForCurrentUser,
  readCachedTreatmentsForCurrentUser,
} from "../../../src/repositories/treatment.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";
import type { Treatment } from "../../../src/domain/treatment";

const ebdLineLabels = {
  laserModality: appStrings.ebdModalityLaser,
  photofacialModality: appStrings.ebdModalityPhotofacial,
};

export default function TreatmentListScreen() {
  const { supabaseEnabled } = useSession();
  const [items, setItems] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No treatments yet. Add one to mirror Flutter list.</Text>
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
