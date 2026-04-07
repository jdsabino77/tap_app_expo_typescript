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
import {
  ethnicitySchema,
  genderSchema,
  skinTypeSchema,
} from "../../src/domain/medical-profile";
import {
  fetchMedicalProfileForUser,
  upsertMedicalProfile,
} from "../../src/repositories/medical-profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

function splitList(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function applyEmptyMedicalForm(
  setters: {
    setDob: (v: string) => void;
    setGender: (v: string) => void;
    setEthnicity: (v: string) => void;
    setSkinType: (v: string) => void;
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
  const [gender, setGender] = useState("preferNotToSay");
  const [ethnicity, setEthnicity] = useState("preferNotToSay");
  const [skinType, setSkinType] = useState("type3");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [prevTreatments, setPrevTreatments] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
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
          if (!cancelled) {
            setLoadingProfile(false);
          }
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
      return;
    }

    const g = genderSchema.safeParse(gender.trim());
    const e = ethnicitySchema.safeParse(ethnicity.trim());
    const sk = skinTypeSchema.safeParse(skinType.trim());
    if (!g.success || !e.success || !sk.success) {
      Alert.alert(
        "Check fields",
        "Gender, ethnicity, and skin type must match app enums (see placeholders below).",
      );
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
      <Text style={styles.title}>Medical profile</Text>
      {isOnboarding ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Onboarding</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>{appStrings.medicalProfileLoadFailed}</Text>
          <Text style={styles.warnDetail}>{loadError}</Text>
        </View>
      ) : null}

      {supabaseEnabled && loadingProfile ? (
        <ActivityIndicator color={colors.primaryNavy} style={styles.loader} />
      ) : null}

      {supabaseEnabled ? (
        <>
          <Text style={styles.hint}>
            Gender: male, female, nonBinary, other, preferNotToSay · Ethnicity: caucasian, asian, … ·
            Skin: type1–type6
          </Text>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            editable={!loadingProfile}
          />
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={setGender}
            placeholder="gender"
            editable={!loadingProfile}
          />
          <TextInput
            style={styles.input}
            value={ethnicity}
            onChangeText={setEthnicity}
            placeholder="ethnicity"
            editable={!loadingProfile}
          />
          <TextInput
            style={styles.input}
            value={skinType}
            onChangeText={setSkinType}
            placeholder="skinType"
            editable={!loadingProfile}
          />
          <TextInput
            style={[styles.input, styles.tall]}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Allergies (comma-separated)"
            multiline
            editable={!loadingProfile}
          />
          <TextInput
            style={[styles.input, styles.tall]}
            value={medications}
            onChangeText={setMedications}
            placeholder="Medications (comma-separated)"
            multiline
            editable={!loadingProfile}
          />
          <TextInput
            style={[styles.input, styles.tall]}
            value={conditions}
            onChangeText={setConditions}
            placeholder="Medical conditions (comma-separated)"
            multiline
            editable={!loadingProfile}
          />
          <TextInput
            style={[styles.input, styles.tall]}
            value={prevTreatments}
            onChangeText={setPrevTreatments}
            placeholder="Previous treatments (comma-separated)"
            multiline
            editable={!loadingProfile}
          />
          <TextInput
            style={[styles.input, styles.tall]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            multiline
            editable={!loadingProfile}
          />
        </>
      ) : (
        <Text style={styles.p}>Supabase off — tap Save to continue (stub).</Text>
      )}

      <Pressable
        style={[styles.primary, (saving || loadingProfile) && styles.disabled]}
        onPress={() => void onSave()}
        disabled={saving || loadingProfile}
      >
        {saving ? (
          <ActivityIndicator color={colors.cleanWhite} />
        ) : (
          <Text style={styles.primaryText}>Save</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  title: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: colors.primaryNavy, fontWeight: "600", fontSize: 12 },
  hint: { marginTop: 8, fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
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
    borderColor: "#E9ECEF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tall: { minHeight: 72, textAlignVertical: "top" },
  primary: {
    marginTop: 16,
    backgroundColor: colors.primaryNavy,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: colors.cleanWhite, textAlign: "center", fontWeight: "600" },
});
