import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MedicalEnumSelect } from "../../src/components/medical-enum-select";
import {
  ethnicityDisplayName,
  ethnicitySchema,
  genderDisplayName,
  genderSchema,
  skinTypeDescription,
  skinTypeSchema,
  type Ethnicity,
  type Gender,
  type SkinType,
} from "../../src/domain/medical-profile";
import {
  fetchMedicalProfileForUser,
  upsertMedicalProfile,
} from "../../src/repositories/medical-profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

const genderOptions = genderSchema.options as readonly Gender[];
const ethnicityOptions = ethnicitySchema.options as readonly Ethnicity[];
const skinTypeOptions = skinTypeSchema.options as readonly SkinType[];

function splitList(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function applyEmptyMedicalForm(
  setters: {
    setDob: (v: string) => void;
    setGender: (v: Gender) => void;
    setEthnicity: (v: Ethnicity) => void;
    setSkinType: (v: SkinType) => void;
    setAllergies: (v: string) => void;
    setMedications: (v: string) => void;
    setConditions: (v: string) => void;
    setPrevTreatments: (v: string) => void;
    setNotes: (v: string) => void;
  },
) {
  setters.setDob("1990-01-01");
  setters.setGender("preferNotToSay");
  setters.setEthnicity("preferNotToSay");
  setters.setSkinType("type3");
  setters.setAllergies("");
  setters.setMedications("");
  setters.setConditions("");
  setters.setPrevTreatments("");
  setters.setNotes("");
}

export default function MedicalProfileScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const { supabaseEnabled, userId, refreshMedicalProfileGate, completeStubMedicalOnboarding } =
    useSession();
  const isOnboarding = onboarding === "true";

  const [dob, setDob] = useState("1990-01-01");
  const [gender, setGender] = useState<Gender>("preferNotToSay");
  const [ethnicity, setEthnicity] = useState<Ethnicity>("preferNotToSay");
  const [skinType, setSkinType] = useState<SkinType>("type3");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [prevTreatments, setPrevTreatments] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(supabaseEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled || !userId) {
        setLoadingProfile(false);
        setLoadError(null);
        return;
      }
      let cancelled = false;
      setLoadingProfile(true);
      setLoadError(null);
      void fetchMedicalProfileForUser(userId)
        .then((row) => {
          if (cancelled) {
            return;
          }
          if (!row) {
            applyEmptyMedicalForm({
              setDob,
              setGender,
              setEthnicity,
              setSkinType,
              setAllergies,
              setMedications,
              setConditions,
              setPrevTreatments,
              setNotes,
            });
            return;
          }
          setDob(format(row.dateOfBirth, "yyyy-MM-dd"));
          setGender(row.gender);
          setEthnicity(row.ethnicity);
          setSkinType(row.skinType);
          setAllergies(row.allergies.join(", "));
          setMedications(row.medications.join(", "));
          setConditions(row.medicalConditions.join(", "));
          setPrevTreatments(row.previousTreatments.join(", "));
          setNotes(row.notes ?? "");
        })
        .catch((e) => {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : String(e));
          }
        })
        .finally(() => {
          setLoadingProfile(false);
        });
      return () => {
        cancelled = true;
      };
    }, [supabaseEnabled, userId]),
  );

  const onSave = async () => {
    if (!supabaseEnabled) {
      completeStubMedicalOnboarding();
      router.replace("/(app)");
      return;
    }
    if (!userId) {
      Alert.alert("Not signed in", "Your session is missing. Try signing out and back in.");
      return;
    }

    const g = genderSchema.safeParse(gender.trim());
    const e = ethnicitySchema.safeParse(ethnicity.trim());
    const sk = skinTypeSchema.safeParse(skinType.trim());
    if (!g.success || !e.success || !sk.success) {
      Alert.alert("Check fields", appStrings.medicalProfileCheckFieldsBody);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert("Date of birth", "Use YYYY-MM-DD.");
      return;
    }

    setSaving(true);
    try {
      await upsertMedicalProfile(userId, {
        dateOfBirth: dob,
        gender: g.data,
        ethnicity: e.data,
        skinType: sk.data,
        allergies: splitList(allergies),
        medications: splitList(medications),
        medicalConditions: splitList(conditions),
        previousTreatments: splitList(prevTreatments),
        notes: notes.trim() || null,
      });
      await refreshMedicalProfileGate();
      router.replace("/(app)");
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{appStrings.navMedicalProfile}</Text>
      {isOnboarding ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{appStrings.medicalProfileOnboardingBadge}</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>{appStrings.medicalProfileLoadFailed}</Text>
          <Text style={styles.warnDetail}>{loadError}</Text>
        </View>
      ) : null}

      {supabaseEnabled && loadingProfile && !loadError ? (
        <ActivityIndicator color={colors.primaryNavy} style={styles.loader} />
      ) : null}

      {supabaseEnabled && (!loadingProfile || loadError) ? (
        <>
          <Text style={styles.intro}>{appStrings.medicalProfileIntro}</Text>

          <Text style={[styles.label, styles.labelFirst]}>{appStrings.medicalProfileDobLabel}</Text>
          <Text style={styles.fieldHint}>{appStrings.medicalProfileDobHint}</Text>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{appStrings.medicalProfileGenderLabel}</Text>
          <MedicalEnumSelect
            sheetTitle={appStrings.medicalProfileGenderLabel}
            value={gender}
            options={genderOptions}
            formatOption={(v) => genderDisplayName(v as Gender)}
            onChange={(v) => setGender(v as Gender)}
          />

          <Text style={styles.label}>{appStrings.medicalProfileEthnicityLabel}</Text>
          <MedicalEnumSelect
            sheetTitle={appStrings.medicalProfileEthnicityLabel}
            value={ethnicity}
            options={ethnicityOptions}
            formatOption={(v) => ethnicityDisplayName(v as Ethnicity)}
            onChange={(v) => setEthnicity(v as Ethnicity)}
          />

          <Text style={styles.label}>{appStrings.medicalProfileSkinTypeLabel}</Text>
          <MedicalEnumSelect
            sheetTitle={appStrings.medicalProfileSkinTypeLabel}
            value={skinType}
            options={skinTypeOptions}
            formatOption={(v) => skinTypeDescription(v as SkinType)}
            onChange={(v) => setSkinType(v as SkinType)}
          />

          <Text style={styles.label}>{appStrings.medicalProfileAllergiesLabel}</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={allergies}
            onChangeText={setAllergies}
            placeholder={appStrings.medicalProfileAllergiesPlaceholder}
            placeholderTextColor={colors.textLight}
            multiline
          />

          <Text style={styles.label}>{appStrings.medicalProfileMedicationsLabel}</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={medications}
            onChangeText={setMedications}
            placeholder={appStrings.medicalProfileMedicationsPlaceholder}
            placeholderTextColor={colors.textLight}
            multiline
          />

          <Text style={styles.label}>{appStrings.medicalProfileConditionsLabel}</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={conditions}
            onChangeText={setConditions}
            placeholder={appStrings.medicalProfileConditionsPlaceholder}
            placeholderTextColor={colors.textLight}
            multiline
          />

          <Text style={styles.label}>{appStrings.medicalProfilePrevTreatmentsLabel}</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={prevTreatments}
            onChangeText={setPrevTreatments}
            placeholder={appStrings.medicalProfilePrevTreatmentsPlaceholder}
            placeholderTextColor={colors.textLight}
            multiline
          />

          <Text style={styles.label}>{appStrings.medicalProfileNotesLabel}</Text>
          <TextInput
            style={[styles.input, styles.tall]}
            value={notes}
            onChangeText={setNotes}
            placeholder={appStrings.medicalProfileNotesPlaceholder}
            placeholderTextColor={colors.textLight}
            multiline
          />
        </>
      ) : null}

      {!supabaseEnabled ? (
        <Text style={styles.p}>Supabase off — tap Save to continue (stub).</Text>
      ) : null}

      <Pressable
        style={[
          styles.primary,
          (saving || (supabaseEnabled && loadingProfile && !loadError)) && styles.disabled,
        ]}
        onPress={() => void onSave()}
        disabled={saving || (supabaseEnabled && loadingProfile && !loadError)}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryNavy} />
        ) : (
          <Text style={styles.primaryText}>{appStrings.medicalProfileSave}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  title: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  intro: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 14,
  },
  labelFirst: { marginTop: 8 },
  fieldHint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
    marginBottom: 8,
  },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: colors.primaryNavy, fontWeight: "600", fontSize: 12 },
  loader: { marginVertical: 20 },
  warnBox: {
    marginTop: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFE69C",
  },
  warnText: { fontSize: 13, color: colors.textPrimary, fontWeight: "600" },
  warnDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  p: { marginTop: 12, color: colors.textSecondary },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tall: { minHeight: 72, textAlignVertical: "top" },
  primary: {
    marginTop: 16,
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.7 },
  primaryText: {
    color: colors.primaryNavy,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
