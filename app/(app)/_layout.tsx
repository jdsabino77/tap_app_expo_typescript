import { Stack } from "expo-router";

/** Signed-in stack (Flutter `DashboardPage` and all `Navigator.push` targets). */
export default function AppGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: "#1A2332",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
      <Stack.Screen name="treatments" options={{ headerShown: false }} />
      <Stack.Screen name="providers" options={{ headerShown: false }} />
    </Stack>
  );
}
