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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PassportLogo } from "../../src/components/PassportLogo";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
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
      setError(appStrings.acceptTermsToContinue);
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
      Alert.alert(appStrings.checkEmailTitle, appStrings.checkEmailBody);
      router.replace("/(auth)/login");
      return;
    }
    router.replace("/(app)");
  };

  /**
   * Bottom padding for home indicator + room to scroll the primary button above the keyboard.
   * On iOS we avoid KeyboardAvoidingView: Tab / simulator focus changes can flash the software
   * keyboard and KAV `padding` shrinks the whole view, clipping the scroll area. ScrollView’s
   * `automaticallyAdjustKeyboardInsets` adjusts insets only on the scroll view instead.
   */
  const contentBottomPad = Math.max(insets.bottom, 16) + 100;

  const scroll = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { paddingBottom: contentBottomPad }]}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
    >
      <PassportLogo size={100} />
      <Text style={styles.headline}>{appStrings.joinHeadline}</Text>
      <Text style={styles.sub}>{appStrings.joinSubtitle}</Text>
      {supabaseEnabled ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{appStrings.signUpWhatHappensHint}</Text>
        </View>
      ) : null}

      {supabaseEnabled ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={appStrings.firstNameHint}
            placeholderTextColor={colors.textLight}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder={appStrings.lastNameHint}
            placeholderTextColor={colors.textLight}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder={appStrings.emailHint}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            textContentType="username"
            autoComplete="email"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={appStrings.passwordHint}
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            autoComplete={Platform.OS === "android" ? "password-new" : "password"}
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={appStrings.confirmPasswordPlaceholder}
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            textContentType="password"
            autoComplete="password"
            autoCorrect={false}
          />
          <Pressable style={styles.checkboxRow} onPress={() => setAcceptedTerms(!acceptedTerms)}>
            <View style={[styles.box, acceptedTerms && styles.boxOn]} />
            <Text style={styles.checkboxLabel}>
              {appStrings.termsCheckboxLead}
              <Text style={styles.linkInline} onPress={() => router.push("/legal/terms")}>
                {appStrings.termsAndConditions}
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
              <Text style={styles.primaryText}>{appStrings.createAccount}</Text>
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
          <Text style={styles.link}>{appStrings.alreadyHaveAccount}</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );

  if (Platform.OS === "ios") {
    return <View style={styles.flex}>{scroll}</View>;
  }
  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {scroll}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  container: { padding: 24 },
  headline: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryNavy,
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
