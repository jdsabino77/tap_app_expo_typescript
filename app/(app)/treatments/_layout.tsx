import { Stack } from "expo-router";

export default function TreatmentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: "#1A2332",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Treatments" }} />
      <Stack.Screen name="new" options={{ title: "New treatment" }} />
      <Stack.Screen name="[id]" options={{ title: "Treatment" }} />
    </Stack>
  );
}
