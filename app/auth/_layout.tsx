import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function AuthDeepLinkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.lightGray },
      }}
    >
      <Stack.Screen name="callback" />
    </Stack>
  );
}
