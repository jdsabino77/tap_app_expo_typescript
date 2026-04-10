import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { exclusiveConditionPreviewStubs } from "../../src/services/skin-analyzer/conditionTypes";
import {
  analyzePigmentation,
  isSkinAnalyzerNotAvailableError,
  type ConditionAreaEstimate,
  type PigmentAnalysisResult,
} from "../../src/services/skin-analyzer/pigmentation";
import { stubRecommendedTreatments } from "../../src/services/skin-analyzer/recommendedTreatmentsStub";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

function conditionLabel(id: string): string {
  switch (id) {
    case "melasma":
      return appStrings.skinAnalyzerConditionMelasma;
    case "solar_lentigines":
      return appStrings.skinAnalyzerConditionSolarLentigines;
    case "freckles":
      return appStrings.skinAnalyzerConditionFreckles;
    case "pih":
      return appStrings.skinAnalyzerConditionPIH;
    default:
      return id;
  }
}

/**
 * Face / Skin Analyzer — iOS runs bundled Core ML via `tap-skin-analyzer` (dev client build).
 */
export default function SkinAnalyzerScreen() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PigmentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChoosePhoto = useCallback(async () => {
    setError(null);
    setResult(null);

    if (Platform.OS !== "ios") {
      setError("Skin analyzer runs on iOS only.");
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(appStrings.photoPermissionDeniedTitle, appStrings.photoPermissionDeniedMessage, [
        { text: "Cancel", style: "cancel" },
        { text: appStrings.photoPermissionOpenSettings, onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (picked.canceled || !picked.assets?.[0]?.uri) {
      return;
    }

    const uri = picked.assets[0].uri;
    setBusy(true);
    try {
      const out = await analyzePigmentation(uri);
      setResult(out);
    } catch (e) {
      const msg = isSkinAnalyzerNotAvailableError(e)
        ? e.message
        : e instanceof Error
          ? e.message
          : String(e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, []);

  const iosOnlyNote =
    Platform.OS !== "ios"
      ? "On-device Core ML runs on iOS only. Android or web would need a different pipeline."
      : null;

  const conditionRows: ConditionAreaEstimate[] =
    result?.conditions?.length ?
      result.conditions
    : exclusiveConditionPreviewStubs.map((s) => ({
        ...s,
        label: conditionLabel(s.id),
      }));
  const conditionRowsArePreview = !result?.conditions?.length;

  const recommendedTreatments =
    result != null ? stubRecommendedTreatments(conditionRows) : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.disclaimerBanner}>{appStrings.skinAnalyzerNonDiagnosticBanner}</Text>
      <Text style={styles.p}>{appStrings.skinAnalyzerIntro}</Text>
      {iosOnlyNote ? <Text style={styles.warn}>{iosOnlyNote}</Text> : null}

      {Platform.OS === "ios" ? (
        <>
          <Text style={styles.hint}>{appStrings.skinAnalyzerWorkflowHint}</Text>
          <Pressable
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            onPress={onChoosePhoto}
            disabled={busy}
          >
            {busy ? (
              <View style={styles.btnBusyRow}>
                <ActivityIndicator color={colors.primaryNavy} />
                <Text style={styles.primaryBtnTextBusy}>{appStrings.skinAnalyzerAnalyzing}</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>
                {result ? appStrings.skinAnalyzerPickAnotherPhoto : appStrings.skinAnalyzerPickPhoto}
              </Text>
            )}
          </Pressable>
        </>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {result?.affectedPercent != null ? (
        <Text style={styles.metric}>
          {appStrings.skinAnalyzerAffectedLabel}: {result.affectedPercent.toFixed(1)}%
        </Text>
      ) : null}

      {result?.maskBase64 ? (
        <View style={styles.maskBlock}>
          <Text style={styles.sub}>{appStrings.skinAnalyzerMaskCaption}</Text>
          <Image
            accessibilityLabel="Segmentation mask preview"
            source={{ uri: `data:image/png;base64,${result.maskBase64}` }}
            style={styles.maskImage}
          />
        </View>
      ) : null}

      {Platform.OS === "ios" && result != null ? (
        <View style={styles.conditionCard}>
          <Text style={styles.conditionCardTitle}>{appStrings.skinAnalyzerConditionSectionTitle}</Text>
          {conditionRowsArePreview ? (
            <Text style={styles.previewDisclaimer}>{appStrings.skinAnalyzerConditionPreviewDisclaimer}</Text>
          ) : null}
          {conditionRows.map((row) => (
            <View key={row.id} style={styles.conditionRow}>
              <Text style={styles.conditionLabel} numberOfLines={2}>
                {row.label}
              </Text>
              <Text style={styles.conditionPercent}>{row.areaPercent.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      {Platform.OS === "ios" && result != null && recommendedTreatments.length > 0 ? (
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>{appStrings.skinAnalyzerRecommendedTitle}</Text>
          <Text style={styles.recommendDisclaimer}>{appStrings.skinAnalyzerRecommendedDisclaimer}</Text>
          {recommendedTreatments.map((item) => (
            <View key={`${item.title}-${item.subtitle ?? ""}`} style={styles.recommendRow}>
              <Text style={styles.recommendMain}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.recommendSub}>{item.subtitle}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sub}>Notes</Text>
      <Text style={styles.bullet}>• {appStrings.skinAnalyzerBulletPipeline}</Text>
      <Text style={styles.bullet}>• {appStrings.skinAnalyzerBulletDocs}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.lightGray },
  container: { padding: 20, paddingBottom: 40 },
  disclaimerBanner: {
    backgroundColor: colors.warningOrange,
    color: colors.primaryNavy,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  p: { color: colors.textPrimary, lineHeight: 22, marginBottom: 16 },
  warn: {
    color: colors.warningOrange,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 16,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  err: { color: "#b00020", lineHeight: 20, marginTop: 12, marginBottom: 8 },
  conditionCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  conditionCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primaryNavy,
    marginBottom: 8,
  },
  previewDisclaimer: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  conditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8e8e8",
  },
  conditionLabel: { flex: 1, paddingRight: 12, color: colors.textPrimary, fontSize: 15, lineHeight: 20 },
  conditionPercent: { fontSize: 15, fontWeight: "700", color: colors.primaryNavy },
  recommendCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primaryNavy,
    marginBottom: 8,
  },
  recommendDisclaimer: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  recommendRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8e8e8",
  },
  recommendMain: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  recommendSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 },
  metric: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryNavy,
  },
  maskBlock: { marginTop: 16 },
  maskImage: {
    width: 256,
    height: 256,
    marginTop: 8,
    alignSelf: "center",
    resizeMode: "contain",
    backgroundColor: colors.cleanWhite,
  },
  sub: { fontSize: 15, fontWeight: "600", color: colors.primaryNavy, marginTop: 20, marginBottom: 8 },
  bullet: { color: colors.textSecondary, lineHeight: 22, marginBottom: 6, paddingLeft: 4 },
  primaryBtn: {
    marginTop: 4,
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primaryGold,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
  btnBusyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primaryBtnTextBusy: {
    color: colors.primaryNavy,
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10,
  },
});
