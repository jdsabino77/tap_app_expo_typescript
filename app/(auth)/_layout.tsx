import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="welcome" options={{ title: "Welcome", headerLeft: () => null }} />
      <Stack.Screen name="splash" options={{ title: "T.A.P", headerShown: false }} />
    </Stack>
  );
}
