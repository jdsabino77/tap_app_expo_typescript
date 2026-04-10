import { Stack } from "expo-router";
import { NestedStackExitBackButton } from "../../../src/components/parent-stack-back-button";
import { colors } from "../../../src/theme/tokens";

export default function TreatmentsStackLayout() {
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
          title: "Treatments",
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "New treatment", headerLeft: () => <NestedStackExitBackButton /> }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Treatment", headerLeft: () => <NestedStackExitBackButton /> }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{ title: "Edit treatment", headerLeft: () => <NestedStackExitBackButton /> }}
      />
    </Stack>
  );
}
