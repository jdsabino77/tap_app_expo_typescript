import { HeaderBackButton, type HeaderBackButtonProps } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { CLINIC_WEB } from "../../src/constants/clinicWeb";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

/**
 * Replace this copy with counsel-approved text before production.
 * Serves as a structured placeholder for Flutter `TermsAndConditionsPage`.
 */
export default function TermsScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props: HeaderBackButtonProps) => (
        <HeaderBackButton
          {...props}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/login");
            }
          }}
        />
      ),
    });
  }, [navigation, router]);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.warn}>
        Sample text only — not legal advice. Replace with your organization&apos;s final terms before release.
      </Text>
      <Pressable
        style={styles.cta}
        onPress={() => {
          void Linking.openURL(CLINIC_WEB.termsOfUse);
        }}
      >
        <Text style={styles.ctaText}>{appStrings.legalOpenFullTermsWebsite}</Text>
      </Pressable>
      <Text style={styles.h1}>Terms &amp; Conditions (placeholder)</Text>
      <Text style={styles.p}>
        By using T.A.P (&quot;the App&quot;), you agree to these terms. If you do not agree, do not use the App.
      </Text>
      <Text style={styles.h2}>1. Medical information</Text>
      <Text style={styles.p}>
        The App may help you record aesthetic and treatment-related information. It does not provide medical advice,
        diagnosis, or treatment. Always follow the guidance of a qualified licensed professional for clinical decisions.
      </Text>
      <Text style={styles.h2}>2. Accuracy of your data</Text>
      <Text style={styles.p}>
        You are responsible for the accuracy of information you enter. The App and its operators are not liable for
        errors or omissions in user-submitted content.
      </Text>
      <Text style={styles.h2}>3. Account &amp; security</Text>
      <Text style={styles.p}>
        You are responsible for safeguarding your login credentials and for activity under your account. Notify support
        promptly if you suspect unauthorized access.
      </Text>
      <Text style={styles.h2}>4. Service changes</Text>
      <Text style={styles.p}>
        Features may change or be discontinued. Where required by law, material changes to terms will be communicated
        through the App or other reasonable means.
      </Text>
      <Text style={styles.h2}>5. Contact</Text>
      <Text style={styles.p}>
        For questions about these terms, contact your clinic administrator or the email address provided by your
        organization.
      </Text>
      <Link href="/(auth)/login" style={styles.link}>
        Back to sign in
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 48 },
  warn: {
    backgroundColor: colors.warningOrange,
    color: colors.primaryNavy,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  cta: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  ctaText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 15 },
  h1: { fontSize: 22, fontWeight: "700", color: colors.primaryNavy, marginBottom: 12 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.primaryNavy, marginTop: 16, marginBottom: 8 },
  p: { color: colors.textPrimary, lineHeight: 22, marginBottom: 8, fontSize: 15 },
  link: { marginTop: 24, color: colors.primaryNavy, fontWeight: "600" },
});
