import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

/**
 * Logout: Flutter `SettingsPage` uses `pushAndRemoveUntil` → `LoginPage`.
 * Here: `signOut` + `router.replace` to auth stack (clears signed-in history for UX).
 */
export default function SettingsScreen() {
  const { signOut, supabaseEnabled } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled) {
        setIsAdmin(false);
        return;
      }
      void fetchOwnProfileRow()
        .then((p) => setIsAdmin(Boolean(p?.is_admin)))
        .catch(() => setIsAdmin(false));
    }, [supabaseEnabled]),
  );

  const onLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => {
            router.replace("/(auth)/login");
          });
        },
      },
    ]);
  };

  const version = Constants.expoConfig?.version ?? "—";
  const iosPlatform = Constants.platform?.ios as { buildNumber?: string | null } | undefined;
  const build =
    (typeof Constants.expoConfig?.ios?.buildNumber === "string" && Constants.expoConfig.ios.buildNumber) ||
    (typeof iosPlatform?.buildNumber === "string" && iosPlatform.buildNumber.length > 0
      ? iosPlatform.buildNumber
      : null) ||
    "—";

  return (
    <View style={styles.container}>
      <Text style={styles.section}>About</Text>
      <View style={styles.rowStatic}>
        <Text style={styles.rowLabel}>{appStrings.settingsVersionLabel}</Text>
        <Text style={styles.rowValue}>{version}</Text>
      </View>
      <View style={styles.rowStatic}>
        <Text style={styles.rowLabel}>{appStrings.settingsBuildLabel}</Text>
        <Text style={styles.rowValue}>{build}</Text>
      </View>
      <Link href="/legal/privacy" asChild>
        <Pressable style={styles.row}>
          <Text style={styles.linkish}>{appStrings.privacyPolicy}</Text>
        </Pressable>
      </Link>
      <Link href="/legal/terms" asChild>
        <Pressable style={styles.row}>
          <Text style={styles.linkish}>Terms &amp; Conditions</Text>
        </Pressable>
      </Link>

      {isAdmin ? (
        <>
          <Text style={styles.section}>Admin</Text>
          <Link href="/catalog-admin" asChild>
            <Pressable style={styles.row}>
              <Text style={styles.linkish}>{appStrings.catalogAdminTitle}</Text>
            </Pressable>
          </Link>
          <Link href="/admin-users" asChild>
            <Pressable style={styles.row}>
              <Text style={styles.linkish}>{appStrings.adminUsersTitle}</Text>
            </Pressable>
          </Link>
        </>
      ) : null}

      <Text style={styles.section}>Account</Text>
      {supabaseEnabled ? (
        <Link href="/profile-settings" asChild>
          <Pressable style={styles.row}>
            <Text style={styles.linkish}>{appStrings.profileSettingsTitle}</Text>
          </Pressable>
        </Link>
      ) : null}
      <Pressable style={styles.row} onPress={onLogout}>
        <Text style={styles.danger}>Log out</Text>
      </Pressable>
      <Text style={styles.muted}>
        More settings from Flutter are tracked in docs/SETTINGS_FEATURES.md. Reference catalogs cache locally after
        the first successful load (SQLite on iOS/Android; browser storage on web).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryNavy,
    marginBottom: 12,
  },
  row: {
    backgroundColor: colors.cleanWhite,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  rowStatic: {
    backgroundColor: colors.cleanWhite,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  rowValue: { fontSize: 16, color: colors.textSecondary },
  linkish: { fontSize: 16, color: colors.primaryNavy, fontWeight: "600" },
  danger: { color: colors.errorRed, fontWeight: "600", fontSize: 16 },
  muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
