import { HeaderBackButton, type HeaderBackButtonProps } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { CLINIC_WEB } from "../../src/constants/clinicWeb";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

export default function PrivacyScreen() {
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
              router.replace("/(app)/settings");
            }
          }}
        />
      ),
    });
  }, [navigation, router]);

  const openSite = () => {
    void Linking.openURL(CLINIC_WEB.privacyPolicy);
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.p}>{appStrings.legalPrivacySummaryLead}</Text>
      <Pressable style={styles.cta} onPress={openSite}>
        <Text style={styles.ctaText}>{appStrings.legalOpenFullPrivacyWebsite}</Text>
      </Pressable>
      <Text style={styles.muted}>
        If the link does not open, visit {CLINIC_WEB.privacyPolicy} in your browser.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 48 },
  p: { color: colors.textPrimary, lineHeight: 22, marginBottom: 20, fontSize: 15 },
  cta: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  ctaText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
  muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
