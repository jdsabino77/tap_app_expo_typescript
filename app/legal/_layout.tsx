import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primaryNavy,
      }}
    >
      <Stack.Screen name="terms" options={{ title: "Terms & Conditions" }} />
    </Stack>
  );
}
