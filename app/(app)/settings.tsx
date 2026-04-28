import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { Link, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { useThemePreference } from "../../src/store/theme";
import type { AppTheme } from "../../src/theme/theme";
import { colors } from "../../src/theme/tokens";

/**
 * Logout: Flutter `SettingsPage` uses `pushAndRemoveUntil` → `LoginPage`.
 * Here: `signOut` + `router.replace` to auth stack (clears signed-in history for UX).
 */
export default function SettingsScreen() {
  const { signOut, supabaseEnabled } = useSession();
  const { theme, themeMode, setThemeMode } = useThemePreference();
  const [isAdmin, setIsAdmin] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

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

      <Text style={styles.section}>{appStrings.settingsAppearanceSection}</Text>
      <ThemeModeOption
        label={appStrings.settingsThemeLight}
        selected={themeMode === "light"}
        onPress={() => setThemeMode("light")}
        theme={theme}
      />
      <ThemeModeOption
        label={appStrings.settingsThemeDark}
        selected={themeMode === "dark"}
        onPress={() => setThemeMode("dark")}
        theme={theme}
      />
      <ThemeModeOption
        label={appStrings.settingsThemeSystem}
        selected={themeMode === "system"}
        onPress={() => setThemeMode("system")}
        theme={theme}
      />

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

function ThemeModeOption({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}) {
  const modeStyles = useMemo(() => createModeStyles(theme), [theme]);
  return (
    <Pressable style={modeStyles.row} onPress={onPress}>
      <Text style={modeStyles.label}>{label}</Text>
      <View style={[modeStyles.radioOuter, selected ? modeStyles.radioOuterSelected : null]}>
        {selected ? <View style={modeStyles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

function createModeStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
    },
    label: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: "500" },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.textLight,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterSelected: {
      borderColor: colors.primaryGold,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primaryGold,
    },
  });
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
    section: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.textPrimary,
      marginBottom: 12,
      marginTop: 2,
    },
    row: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    rowStatic: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowLabel: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: "500" },
    rowValue: { fontSize: 16, color: theme.colors.textSecondary },
    linkish: {
      fontSize: 16,
      color: theme.mode === "dark" ? theme.colors.primaryGold : theme.colors.primaryNavy,
      fontWeight: "600",
    },
    danger: { color: colors.errorRed, fontWeight: "600", fontSize: 16 },
    muted: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  });
}
