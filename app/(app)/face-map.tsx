import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

/**
 * Flutter `face_map_page` is a large UI surface; on-device analysis is tracked separately
 * (see migration plan + skin analyzer integration doc). This screen stays a product shell until ML/camera work lands.
 */
export default function FaceMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.p}>
        Place holder for an option to enter a treatment via a medical image of a human body part where a user can pick the area of treatment.
      </Text>
      <Text style={styles.sub}>Planned capabilities (high level)</Text>
      <Text style={styles.bullet}>• User selects area of treatment based on locatoins of the body</Text>
      <Text style={styles.bullet}>• due to the nataure of multi location treatments, this will likely be removed</Text>
      <Text style={styles.bullet}>• Optional sync with treatment history in this app</Text>
      <Link href="/treatments" asChild>
        <Pressable style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>{appStrings.goToTreatments}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.lightGray },
  p: { color: colors.textPrimary, lineHeight: 22, marginBottom: 16 },
  sub: { fontSize: 15, fontWeight: "600", color: colors.primaryNavy, marginBottom: 8 },
  bullet: { color: colors.textSecondary, lineHeight: 22, marginBottom: 6, paddingLeft: 4 },
  linkBtn: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryGold,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  linkBtnText: { color: colors.primaryNavy, fontWeight: "700" },
});
