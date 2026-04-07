import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function SignUpScreen() {
  const { supabaseEnabled, signUpWithDetails, devSignUpStub } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await signUpWithDetails({
      firstName,
      lastName,
      email,
      password,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.needsEmailConfirmation) {
      Alert.alert("Check your email", "Confirm your account, then sign in.");
      router.replace("/(auth)/login");
      return;
    }
    router.replace("/(app)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>

        {supabaseEnabled ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.textLight}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.textLight}
              value={lastName}
              onChangeText={setLastName}
            />
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
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
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
                <Text style={styles.primaryText}>Sign up</Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.primary}
            onPress={() => {
              devSignUpStub();
              router.replace("/(app)");
            }}
          >
            <Text style={styles.primaryText}>Stub: sign up → Dashboard</Text>
          </Pressable>
        )}

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", color: colors.primaryNavy, marginBottom: 20 },
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
    marginBottom: 16,
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: colors.primaryNavy, textAlign: "center", fontWeight: "600" },
  linkWrap: { paddingVertical: 12 },
  link: { color: colors.primaryNavy, textAlign: "center" },
});
