import { Stack } from "expo-router";

export default function ProvidersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: "#1A2332",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Providers" }} />
      <Stack.Screen name="new" options={{ title: "Add provider" }} />
      <Stack.Screen name="[id]" options={{ title: "Provider" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Edit provider" }} />
    </Stack>
  );
}
