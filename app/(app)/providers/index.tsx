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
import type { Provider } from "../../../src/domain/provider";
import { providerFullAddress } from "../../../src/domain/provider";
import { fetchProvidersForCurrentUser } from "../../../src/repositories/provider.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function ProvidersScreen() {
  const { supabaseEnabled } = useSession();
  const [items, setItems] = useState<Provider[]>([]);
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
      const rows = await fetchProvidersForCurrentUser();
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load providers");
      setItems([]);
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

  if (!supabaseEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.p}>Connect Supabase to load providers.</Text>
        <Link href="/providers/new" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Add provider</Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No providers found.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/providers/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{providerFullAddress(item)}</Text>
            {item.services.length > 0 ? (
              <Text style={styles.tags}>{item.services.join(" · ")}</Text>
            ) : null}
          </Pressable>
        )}
      />
      <Link href="/providers/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+ Add</Text>
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
  },
  name: { fontSize: 17, fontWeight: "600", color: colors.primaryNavy },
  sub: { marginTop: 6, fontSize: 14, color: colors.textSecondary },
  tags: { marginTop: 8, fontSize: 13, color: colors.textLight },
  btn: { backgroundColor: colors.primaryGold, paddingVertical: 14, borderRadius: 8 },
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
