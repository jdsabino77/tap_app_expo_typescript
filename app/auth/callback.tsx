import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/theme/tokens";

/**
 * Supabase email links use `redirectTo` → `/auth/callback` (see `getAuthEmailRedirectUri`).
 * Tokens are applied in `SessionProvider` via `Linking`; this screen only leaves the deep-link route.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/");
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primaryNavy} />
      <Text style={styles.label}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.lightGray,
  },
  label: { marginTop: 16, fontSize: 15, color: colors.textSecondary },
});
