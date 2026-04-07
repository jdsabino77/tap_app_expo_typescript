import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSession } from "../src/store/session";
import { colors } from "../src/theme/tokens";

/** Gate: login → welcome vs app by medical profile; signup bypass for one session (see session). */
export default function Index() {
  const {
    initialized,
    supabaseEnabled,
    userId,
    hasMedicalProfile,
    signupDashboardBypass,
  } = useSession();

  if (!initialized) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
        <Text style={styles.loadingLabel}>Starting…</Text>
      </View>
    );
  }

  if (!userId) {
    return <Redirect href="/(auth)/login" />;
  }

  if (supabaseEnabled) {
    if (hasMedicalProfile === null) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryNavy} />
          <Text style={styles.loadingLabel}>Loading your profile…</Text>
        </View>
      );
    }
    const goApp = signupDashboardBypass || hasMedicalProfile === true;
    if (!goApp) {
      return <Redirect href="/(auth)/welcome" />;
    }
    return <Redirect href="/(app)" />;
  }

  if (!hasMedicalProfile) {
    return <Redirect href="/(auth)/welcome" />;
  }
  return <Redirect href="/(app)" />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  loadingLabel: { marginTop: 16, fontSize: 15, color: colors.textSecondary },
});
