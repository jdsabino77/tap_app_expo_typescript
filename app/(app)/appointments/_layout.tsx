import { Stack } from "expo-router";
import { NestedStackExitBackButton } from "../../../src/components/parent-stack-back-button";
import { appStrings } from "../../../src/strings/appStrings";

export default function AppointmentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: "#1A2332",
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: appStrings.newAppointmentTitle,
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: appStrings.appointmentDetailTitle,
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: appStrings.editAppointmentTitle,
          headerLeft: () => <NestedStackExitBackButton />,
        }}
      />
    </Stack>
  );
}
