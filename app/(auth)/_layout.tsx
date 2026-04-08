import { Stack } from "expo-router";
import { appStrings } from "../../src/strings/appStrings";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
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
