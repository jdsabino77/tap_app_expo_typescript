import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  adminListUserProfiles,
  adminSetUserIsAdmin,
  type AdminUserProfileRow,
} from "../../src/repositories/admin-users.repository";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

export default function AdminUsersScreen() {
  const { supabaseEnabled, userId: selfId } = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminUserProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const gate = useCallback(async () => {
    if (!supabaseEnabled) {
      setAllowed(false);
      return;
    }
    const p = await fetchOwnProfileRow();
    setAllowed(Boolean(p?.is_admin));
  }, [supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void gate();
    }, [gate]),
  );

  const load = useCallback(async () => {
    if (!allowed) {
      return;
    }
    setLoading(true);
    try {
      setRows(await adminListUserProfiles());
    } catch (e) {
      Alert.alert("Load failed", e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    if (allowed) {
      void load();
    }
  }, [allowed, load]);

  const onToggle = (row: AdminUserProfileRow, next: boolean) => {
    if (!selfId || row.id === selfId) {
      return;
    }
    setBusyId(row.id);
    void adminSetUserIsAdmin(row.id, next)
      .then(() => {
        setRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, is_admin: next } : r)));
      })
      .catch((e) => {
        Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setBusyId(null);
      });
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase to manage users.</Text>
      </View>
    );
  }

  if (allowed === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>{appStrings.adminUsersAccessDenied}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.hint}>{appStrings.adminUsersHint}</Text>
      {loading ? (
        <ActivityIndicator color={colors.primaryNavy} style={styles.loader} />
      ) : (
        rows.map((r) => {
          const isSelf = selfId != null && r.id === selfId;
          const label = r.display_name?.trim() || r.email || r.id;
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.name} numberOfLines={2}>
                  {label}
                </Text>
                {r.email ? (
                  <Text style={styles.email} numberOfLines={1}>
                    {r.email}
                  </Text>
                ) : null}
              </View>
              <Switch
                value={Boolean(r.is_admin)}
                disabled={isSelf || busyId === r.id}
                onValueChange={(v) => onToggle(r, v)}
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  hint: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  loader: { marginVertical: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cleanWhite,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardText: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
