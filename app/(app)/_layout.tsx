import { Stack } from "expo-router";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

/** Signed-in stack (Flutter `DashboardPage` and all `Navigator.push` targets). */
export default function AppGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primaryNavy,
      }}
    >
      <Stack.Screen name="index" options={{ title: appStrings.dashboardTitle }} />
      <Stack.Screen name="treatments" options={{ headerShown: false }} />
      <Stack.Screen name="providers" options={{ headerShown: false }} />
      <Stack.Screen name="face-map" options={{ title: appStrings.faceMapScreenTitle }} />
      <Stack.Screen name="skin-analyzer" options={{ title: appStrings.skinAnalyzerScreenTitle }} />
      <Stack.Screen name="photo-library" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ title: appStrings.quickActionCalendar }} />
      <Stack.Screen name="appointments" options={{ headerShown: false }} />
      <Stack.Screen name="medical-profile" options={{ title: appStrings.navMedicalProfile }} />
      <Stack.Screen name="settings" options={{ title: appStrings.navSettings }} />
      <Stack.Screen name="profile-settings" options={{ title: appStrings.profileSettingsTitle }} />
      <Stack.Screen name="catalog-admin" options={{ title: appStrings.catalogAdminTitle }} />
      <Stack.Screen name="admin-users" options={{ title: appStrings.adminUsersTitle }} />
    </Stack>
  );
}
