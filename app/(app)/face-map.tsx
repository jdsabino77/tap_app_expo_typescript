import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/theme/tokens";

/**
 * Flutter `face_map_page` is a large UI surface; on-device analysis is tracked separately
 * (see migration plan + skin analyzer integration doc). This screen stays a product shell until ML/camera work lands.
 */
export default function FaceMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face map</Text>
      <Text style={styles.p}>
        The original app ties this area to treatment planning and visual overlays. The Expo build does not run the
        skin analyzer pipeline yet (CoreML / camera capture / segmentation).
      </Text>
      <Text style={styles.sub}>Planned capabilities (high level)</Text>
      <Text style={styles.bullet}>• Capture or import a photo with guided framing</Text>
      <Text style={styles.bullet}>• On-device inference with a bundled model (size + platform constraints TBD)</Text>
      <Text style={styles.bullet}>• Overlays and metrics aligned with clinical review workflows</Text>
      <Text style={styles.bullet}>• Optional sync with treatment history in this app</Text>
      <Link href="/treatments" asChild>
        <Pressable style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Go to treatments</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.lightGray },
  title: { fontSize: 22, fontWeight: "700", color: colors.primaryNavy, marginBottom: 12 },
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
