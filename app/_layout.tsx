import "react-native-gesture-handler";
import { Stack } from "expo-router";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WriteQueueSync } from "../src/components/WriteQueueSync";
import { SessionProvider } from "../src/store/session";
import { colors } from "../src/theme/tokens";

type BoundaryProps = { children: ReactNode };
type BoundaryState = { error: Error | null };

class RootErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("RootErrorBoundary:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={boundaryStyles.wrap}>
          <Text style={boundaryStyles.title}>App failed to render</Text>
          <Text style={boundaryStyles.msg}>{this.state.error.message}</Text>
          <ScrollView style={boundaryStyles.scroll}>
            <Text style={boundaryStyles.stack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const boundaryStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    backgroundColor: colors.cleanWhite,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.primaryNavy, marginBottom: 8 },
  msg: { fontSize: 15, color: colors.errorRed, marginBottom: 12 },
  scroll: { flex: 1 },
  stack: { fontSize: 11, color: colors.textSecondary },
});

/**
 * Root stack: `index` (auth redirect), `(auth)`, `(app)`.
 * Logout / login use `router.replace` to swap groups (Flutter `pushAndRemoveUntil` → login).
 */
export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <SessionProvider>
          <WriteQueueSync />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.lightGray },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="legal" options={{ headerShown: false }} />
          </Stack>
        </SessionProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
