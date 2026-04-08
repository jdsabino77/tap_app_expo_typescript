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
import { PassportLogo } from "../../src/components/PassportLogo";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

export default function ForgotPasswordScreen() {
  const { supabaseEnabled, requestPasswordReset } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(appStrings.emailHint);
      return;
    }
    setLoading(true);
    const res = await requestPasswordReset(trimmed);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <PassportLogo size={100} />
        <Text style={styles.headline}>{appStrings.forgotPasswordTitle}</Text>
        <Text style={styles.sub}>{appStrings.forgotPasswordSubtitle}</Text>

        {supabaseEnabled ? (
          sent ? (
            <>
              <Text style={styles.success}>{appStrings.resetEmailSentNotice}</Text>
              <Pressable style={styles.primary} onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.primaryText}>{appStrings.backToSignIn}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder={appStrings.emailHint}
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <Text style={styles.err}>{error}</Text> : null}
              <Pressable
                style={[styles.primary, loading && styles.disabled]}
                onPress={() => void onSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryNavy} />
                ) : (
                  <Text style={styles.primaryText}>{appStrings.sendResetEmail}</Text>
                )}
              </Pressable>
            </>
          )
        ) : (
          <Text style={styles.banner}>
            Supabase env not set — password reset is unavailable. Add EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart.
          </Text>
        )}

        {!sent ? (
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.linkWrap}>
              <Text style={styles.link}>{appStrings.backToSignIn}</Text>
            </Pressable>
          </Link>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  container: { padding: 24, paddingBottom: 48 },
  headline: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryNavy,
    textAlign: "center",
  },
  sub: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  input: {
    marginTop: 24,
    backgroundColor: colors.cleanWhite,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.primaryNavy,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  primary: {
    marginTop: 20,
    backgroundColor: colors.primaryGold,
    borderRadius: 8,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  primaryText: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy, textAlign: "center" },
  err: { marginTop: 12, color: colors.errorRed, fontSize: 14 },
  success: {
    marginTop: 20,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  banner: {
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.cleanWhite,
    borderRadius: 8,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linkWrap: { marginTop: 24, alignItems: "center" },
  link: { fontSize: 15, color: colors.primaryNavy, fontWeight: "600" },
});
