import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

/**
 * Logout: Flutter `SettingsPage` uses `pushAndRemoveUntil` → `LoginPage`.
 * Here: `signOut` + `router.replace` to auth stack (clears signed-in history for UX).
 */
export default function SettingsScreen() {
  const { signOut } = useSession();

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

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Account</Text>
      <Pressable style={styles.row} onPress={onLogout}>
        <Text style={styles.danger}>Log out</Text>
      </Pressable>
      <Text style={styles.muted}>Flutter settings sections — see docs/SETTINGS_FEATURES.md (Phase 5).</Text>
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
  danger: { color: colors.errorRed, fontWeight: "600", fontSize: 16 },
  muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
