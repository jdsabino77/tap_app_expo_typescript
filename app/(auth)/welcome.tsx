import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/theme/tokens";

/** Flutter `WelcomePage` → `MedicalProfilePage(isOnboarding: true)`. */
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to T.A.P</Text>
      <Text style={styles.sub}>Treatment &amp; Aesthetic Procedures</Text>
      <Text style={styles.body}>
        Let&apos;s set up your medical profile. (Stub — full form in Phase 5.)
      </Text>
      <Pressable
        style={styles.primary}
        onPress={() => router.push("/(app)/medical-profile?onboarding=true")}
      >
        <Text style={styles.primaryText}>Set up medical profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.primaryNavy,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.cleanWhite, textAlign: "center" },
  sub: {
    marginTop: 12,
    fontSize: 18,
    color: colors.primaryGold,
    textAlign: "center",
    fontWeight: "500",
  },
  body: { marginTop: 24, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 22 },
  primary: {
    marginTop: 32,
    backgroundColor: colors.primaryGold,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "700", fontSize: 16 },
});
