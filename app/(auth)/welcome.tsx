import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLayoutEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { useThemePreference } from "../../src/store/theme";
import { colors } from "../../src/theme";
import type { AppTheme } from "../../src/theme/theme";

function FeatureRow({
  icon,
  title,
  subtitle,
  styles,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  styles: ReturnType<typeof createStyles>;
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
  const navigation = useNavigation();
  const { signOut } = useSession();
  const { theme } = useThemePreference();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => void signOut().then(() => router.replace("/(auth)/login"))}
          hitSlop={12}
          style={styles.headerSignOut}
        >
          <Text style={styles.headerSignOutText}>{appStrings.welcomeExitSignOut}</Text>
        </Pressable>
      ),
    });
  }, [navigation, signOut]);

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
        styles={styles}
      />
      <FeatureRow
        icon="calendar-today"
        title={appStrings.welcomeFeature2Title}
        subtitle={appStrings.welcomeFeature2Sub}
        styles={styles}
      />
      <FeatureRow
        icon="insights"
        title={appStrings.welcomeFeature3Title}
        subtitle={appStrings.welcomeFeature3Sub}
        styles={styles}
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

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
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
      backgroundColor: colors.primaryGoldMutedBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    title: {
      marginTop: 32,
      ...theme.typography.headlineLarge,
      fontSize: 32,
      textAlign: "center",
    },
    sub: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: "500",
      color: colors.primaryGold,
      textAlign: "center",
    },
    body: {
      marginTop: 24,
      marginBottom: 8,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    featureRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 16 },
    featureIconWrap: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.primaryGoldMutedBg,
    },
    featureText: { flex: 1, marginLeft: 16 },
    featureTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    featureSub: { marginTop: 4, fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary },
    primary: {
      marginTop: 32,
      backgroundColor: colors.primaryGold,
      paddingVertical: 16,
      borderRadius: 12,
    },
    primaryText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "700", fontSize: 16 },
    headerSignOut: { paddingVertical: 6, paddingHorizontal: 4 },
    headerSignOutText: {
      fontSize: 16,
      color: theme.mode === "dark" ? colors.primaryGold : colors.primaryNavy,
      fontWeight: "600",
    },
  });
}
