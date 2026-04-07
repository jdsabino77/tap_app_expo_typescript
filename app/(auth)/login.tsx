import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

export default function LoginScreen() {
  const {
    supabaseEnabled,
    signInWithPassword,
    devSignInStub,
  } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    setLoading(true);
    const res = await signInWithPassword(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>T.A.P</Text>
        <Text style={styles.sub}>Treatment &amp; Aesthetic Procedures</Text>

        {supabaseEnabled ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.box, acceptedTerms && styles.boxOn]} />
              <Text style={styles.checkboxLabel}>
                I agree to the{" "}
                <Text style={styles.linkInline} onPress={() => router.push("/legal/terms")}>
                  Terms
                </Text>
              </Text>
            </Pressable>
            {error ? <Text style={styles.err}>{error}</Text> : null}
            <Pressable
              style={[styles.primary, loading && styles.disabled]}
              onPress={() => void onSubmit()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryNavy} />
              ) : (
                <Text style={styles.primaryText}>Sign in</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.banner}>
              Supabase env not set — dev stubs only. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart.
            </Text>
            <Pressable
              style={styles.primary}
              onPress={() => {
                devSignInStub(false);
                router.replace("/(auth)/welcome");
              }}
            >
              <Text style={styles.primaryText}>Stub: sign in (no profile → Welcome)</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              onPress={() => {
                devSignInStub(true);
                router.replace("/(app)");
              }}
            >
              <Text style={styles.primaryText}>Stub: sign in (has profile → Dashboard)</Text>
            </Pressable>
          </>
        )}

        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={styles.link}>Sign up</Text>
          </Pressable>
        </Link>

        <Link href="/legal/terms" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={styles.muted}>Terms &amp; Conditions</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/splash" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={styles.muted}>Splash</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "700", color: colors.primaryNavy, textAlign: "center" },
  sub: { marginTop: 8, color: colors.textSecondary, textAlign: "center", marginBottom: 24 },
  banner: {
    backgroundColor: colors.warningOrange,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: colors.primaryNavy,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.primaryNavy,
    borderRadius: 4,
  },
  boxOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  checkboxLabel: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  linkInline: { fontWeight: "700", textDecorationLine: "underline" },
  err: { color: colors.errorRed, marginBottom: 12 },
  primary: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "600" },
  linkWrap: { paddingVertical: 12 },
  link: { color: colors.primaryNavy, textAlign: "center", fontWeight: "600" },
  muted: { color: colors.textSecondary, textAlign: "center", textDecorationLine: "underline" },
});
