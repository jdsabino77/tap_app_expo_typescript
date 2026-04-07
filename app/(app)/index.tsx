import { Link } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

function Row({ href, label }: { href: "/treatments" | "/face-map" | "/providers" | "/medical-profile" | "/calendar" | "/settings"; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.row}>
        <Text style={styles.rowText}>{label}</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    </Link>
  );
}

export default function DashboardScreen() {
  const net = useNetworkStatus();
  const { supabaseEnabled, email } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [treatmentCount, setTreatmentCount] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled) {
        return;
      }
      let cancelled = false;
      setLoadingProfile(true);
      void fetchOwnProfileRow()
        .then((row) => {
          if (cancelled || !row) {
            return;
          }
          const dn =
            row.display_name?.trim() ||
            [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
            row.email;
          setDisplayName(dn ?? null);
          setTreatmentCount(row.treatment_count ?? 0);
        })
        .catch(() => {
          if (!cancelled) {
            setDisplayName(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingProfile(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [supabaseEnabled, email]),
  );

  return (
    <View style={styles.container}>
      {net === "offline" ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — changes may queue until you reconnect.</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        {loadingProfile ? (
          <ActivityIndicator color={colors.primaryNavy} />
        ) : (
          <>
            <Text style={styles.greeting}>
              {displayName ? `Hi, ${displayName}` : supabaseEnabled ? (email ?? "Signed in") : "Dashboard (stub)"}
            </Text>
            {treatmentCount != null ? (
              <Text style={styles.meta}>Treatments logged: {treatmentCount}</Text>
            ) : null}
          </>
        )}
      </View>

      <Text style={styles.hint}>Hub (Flutter Dashboard). Open sections below.</Text>
      <Row href="/treatments" label="Treatments" />
      <Row href="/face-map" label="Face map" />
      <Row href="/providers" label="Providers" />
      <Row href="/medical-profile" label="Medical profile" />
      <Row href="/calendar" label="Calendar" />
      <Row href="/settings" label="Settings" />
      <Link href="/legal/terms" asChild>
        <Pressable style={styles.footerWrap}>
          <Text style={styles.footer}>Terms &amp; Conditions</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray, paddingTop: 8 },
  offlineBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: colors.warningOrange,
    borderRadius: 8,
  },
  offlineText: { color: colors.primaryNavy, fontWeight: "600", fontSize: 13 },
  header: { paddingHorizontal: 16, paddingBottom: 8, minHeight: 48, justifyContent: "center" },
  greeting: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  meta: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  hint: { paddingHorizontal: 16, paddingBottom: 12, color: colors.textSecondary, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.cleanWhite,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  rowText: { fontSize: 17, color: colors.primaryNavy, fontWeight: "500" },
  chev: { fontSize: 22, color: colors.textLight },
  footerWrap: { marginTop: 24, padding: 12 },
  footer: { textAlign: "center", color: colors.primaryNavy, textDecorationLine: "underline" },
});
