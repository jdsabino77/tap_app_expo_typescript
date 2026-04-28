import { Stack } from "expo-router";
import { appStrings } from "../../src/strings/appStrings";
import { useThemePreference } from "../../src/store/theme";

export default function AuthLayout() {
  const { theme } = useThemePreference();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: theme.mode === "dark" ? theme.colors.primaryGold : theme.colors.primaryNavy,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.textPrimary },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: appStrings.signIn }} />
      <Stack.Screen name="forgot-password" options={{ title: appStrings.forgotPasswordTitle }} />
      <Stack.Screen name="signup" options={{ title: appStrings.createAccount }} />
      <Stack.Screen name="welcome" options={{ title: appStrings.welcomeTitle }} />
      <Stack.Screen name="splash" options={{ title: appStrings.appShortName, headerShown: false }} />
    </Stack>
  );
}
