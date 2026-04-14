import { Stack } from "expo-router";
import { NestedStackExitBackButton } from "../../../src/components/parent-stack-back-button";
import { appStrings } from "../../../src/strings/appStrings";
import { colors } from "../../../src/theme/tokens";

export default function PhotoLibraryStackLayout() {
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
          title: appStrings.photoLibraryTitle,
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
      <Stack.Screen
        name="compare"
        options={{
          title: appStrings.photoCompareTitle,
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
    </Stack>
  );
}
