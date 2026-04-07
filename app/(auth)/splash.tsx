import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/theme/tokens";

/**
 * Flutter `SplashPage` → `LoginPage` after delay (not the current app `home`).
 * Kept for parity; root index still defaults to login when signed out.
 */
export default function SplashScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>T.A.P</Text>
      <ActivityIndicator size="large" color={colors.primaryGold} style={styles.spinner} />
      <Text style={styles.muted}>Redirecting to sign in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryNavy,
  },
  title: { fontSize: 32, fontWeight: "700", color: colors.cleanWhite },
  spinner: { marginTop: 24 },
  muted: { marginTop: 16, color: "rgba(255,255,255,0.7)" },
});
