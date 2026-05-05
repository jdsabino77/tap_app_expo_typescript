import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DateInputField } from "./date-input-field";
import type { SurgicalDetails } from "../domain/surgical-details";
import { colors } from "../theme/tokens";

type FieldKey = keyof SurgicalDetails;

const DATE_FIELD_KEYS = new Set<FieldKey>(["removalDate", "exchangeDate"]);

/** For calendar fields we persist `yyyy-MM-dd`; non-matching legacy text is shown separately. */
function ymdOrEmpty(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

const GROUPS: { title: string; fields: { key: FieldKey; label: string }[] }[] = [
  {
    title: "Core",
    fields: [
      { key: "implantCategory", label: "Implant category" },
      { key: "side", label: "Side" },
      { key: "primaryReasonGoal", label: "Primary reason / goal" },
    ],
  },
  {
    title: "Implant-specific",
    fields: [
      { key: "implantType", label: "Implant type" },
      { key: "implantMaterial", label: "Implant material" },
      { key: "brandManufacturer", label: "Brand / manufacturer" },
      { key: "model", label: "Model" },
      { key: "shape", label: "Shape" },
      { key: "textureSurface", label: "Texture / surface" },
      { key: "fillContents", label: "Fill / contents" },
      { key: "sizeVolume", label: "Size / volume" },
      { key: "projectionProfile", label: "Projection / profile" },
      { key: "placementPlane", label: "Placement plane" },
      { key: "incisionLocation", label: "Incision location" },
      { key: "pocketPosition", label: "Pocket / position" },
      { key: "laterality", label: "Laterality" },
      { key: "revisionOrFirstTime", label: "Revision or first-time" },
      { key: "serialLotNumber", label: "Serial / lot number" },
      { key: "implantStatus", label: "Implant status" },
    ],
  },
  {
    title: "Follow-up / history",
    fields: [
      { key: "complications", label: "Complications" },
      { key: "removalDate", label: "Removal date" },
      { key: "exchangeDate", label: "Exchange date" },
      { key: "reasonForRevision", label: "Reason for revision" },
      { key: "currentStatus", label: "Current status" },
      { key: "relatedPhotosDocumentsNote", label: "Related photos / documents" },
    ],
  },
];

export type SurgicalImplantFieldsProps = {
  details: SurgicalDetails;
  onChange: (next: SurgicalDetails) => void;
};

export function SurgicalImplantFields({ details, onChange }: SurgicalImplantFieldsProps) {
  const setField = (key: FieldKey, text: string) => {
    onChange({ ...details, [key]: text });
  };

  return (
    <View>
      <Text style={styles.topHint}>
        Procedure date, provider, and general notes are captured above. Use Treatment areas below for
        anatomical site (head, upper body, lower body). Attach photos in the Photos section below.
      </Text>
      {GROUPS.map((g) => (
        <View key={g.title}>
          <Text style={styles.sectionTitle}>{g.title}</Text>
          {g.fields.map((f) => {
            if (DATE_FIELD_KEYS.has(f.key)) {
              const raw = details[f.key] ?? "";
              const ymd = ymdOrEmpty(raw);
              const legacyNonYmd = raw.trim() !== "" && !ymd ? raw.trim() : null;
              return (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <DateInputField
                    valueYmd={ymd}
                    onChangeYmd={(next) => setField(f.key, next)}
                    inputStyle={styles.input}
                  />
                  {legacyNonYmd ? (
                    <Text style={styles.legacyNote}>Previously entered (edit below): {legacyNonYmd}</Text>
                  ) : null}
                  {ymd ? (
                    <Pressable onPress={() => setField(f.key, "")} hitSlop={8}>
                      <Text style={styles.clearDate}>Clear date</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }
            return (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor={colors.textLight}
                  value={details[f.key] ?? ""}
                  onChangeText={(t) => setField(f.key, t)}
                  multiline={f.key === "complications" || f.key === "reasonForRevision"}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  field: { marginBottom: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
    textAlignVertical: "top",
  },
  legacyNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  clearDate: {
    fontSize: 13,
    color: colors.primaryNavy,
    marginTop: 6,
    fontWeight: "600",
  },
});
