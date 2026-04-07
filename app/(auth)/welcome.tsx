import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

function FeatureRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>
        <MaterialIcons name={icon} size={24} color={colors.primaryGold} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** Flutter `WelcomePage` → `MedicalProfilePage(isOnboarding: true)`. */
export default function WelcomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.flex}>
      <View style={styles.heroIcon}>
        <MaterialIcons name="medical-services" size={60} color={colors.primaryGold} />
      </View>
      <Text style={styles.title}>{appStrings.welcomeTitle}</Text>
      <Text style={styles.sub}>{appStrings.tagline}</Text>
      <Text style={styles.body}>{appStrings.welcomeBody}</Text>

      <FeatureRow
        icon="face"
        title={appStrings.welcomeFeature1Title}
        subtitle={appStrings.welcomeFeature1Sub}
      />
      <FeatureRow
        icon="calendar-today"
        title={appStrings.welcomeFeature2Title}
        subtitle={appStrings.welcomeFeature2Sub}
      />
      <FeatureRow
        icon="insights"
        title={appStrings.welcomeFeature3Title}
        subtitle={appStrings.welcomeFeature3Sub}
      />

      <Pressable
        style={styles.primary}
        onPress={() => router.push("/(app)/medical-profile?onboarding=true")}
      >
        <Text style={styles.primaryText}>{appStrings.setUpMedicalProfile}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primaryNavy },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "stretch",
  },
  heroIcon: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  title: { marginTop: 32, fontSize: 32, fontWeight: "700", color: colors.cleanWhite, textAlign: "center" },
  sub: {
    marginTop: 16,
    fontSize: 18,
    color: colors.primaryGold,
    textAlign: "center",
    fontWeight: "500",
  },
  body: {
    marginTop: 24,
    marginBottom: 8,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 16,
  },
  featureRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 16 },
  featureIconWrap: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  featureText: { flex: 1, marginLeft: 16 },
  featureTitle: { color: colors.cleanWhite, fontSize: 16, fontWeight: "700" },
  featureSub: { marginTop: 4, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20 },
  primary: {
    marginTop: 32,
    backgroundColor: colors.primaryGold,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "700", fontSize: 16 },
});
