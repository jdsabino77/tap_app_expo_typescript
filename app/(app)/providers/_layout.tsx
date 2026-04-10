import { Stack } from "expo-router";
import { colors } from "../../../src/theme/tokens";
import { NestedStackExitBackButton } from "../../../src/components/parent-stack-back-button";

export default function ProvidersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primaryNavy,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Providers",
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "Add provider", headerLeft: () => <NestedStackExitBackButton /> }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Provider", headerLeft: () => <NestedStackExitBackButton /> }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: "Edit provider", headerLeft: () => <NestedStackExitBackButton /> }}
      />
    </Stack>
  );
}
