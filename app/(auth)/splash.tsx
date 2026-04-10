import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

/**
 * Flutter `SplashPage` → `LoginPage` after delay (not the current app `home`).
 * Kept for parity; root index still defaults to login when signed out.
 */
export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    skipTimerRef.current = setTimeout(() => {
      skipTimerRef.current = null;
      router.replace("/(auth)/login");
    }, 2000);
    return () => {
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
      }
    };
  }, []);

  const onSkip = () => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onSkip} style={[styles.skipBtn, { top: 12 + insets.top }]} hitSlop={12}>
        <Text style={styles.skipText}>{appStrings.splashSkip}</Text>
      </Pressable>
      <Text style={styles.title}>{appStrings.appShortName}</Text>
      <ActivityIndicator size="large" color={colors.primaryGold} style={styles.spinner} />
      <Text style={styles.muted}>{appStrings.splashRedirecting}</Text>
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
  skipBtn: {
    position: "absolute",
    right: 20,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: { fontSize: 16, fontWeight: "600", color: colors.primaryGold },
  title: { fontSize: 32, fontWeight: "700", color: colors.cleanWhite },
  spinner: { marginTop: 24 },
  muted: { marginTop: 16, color: colors.onNavySubtle },
});
