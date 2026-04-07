import type { Gender, Ethnicity, SkinType } from "../domain/medical-profile";
import { parseMedicalProfile } from "../domain/medical-profile";
import type { MedicalProfile } from "../domain/medical-profile";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type MedicalProfileInput = {
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  ethnicity: Ethnicity;
  skinType: SkinType;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  previousTreatments: string[];
  notes: string | null;
};

export async function fetchMedicalProfileForUser(userId: string): Promise<MedicalProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("medical_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  return parseMedicalProfile({
    id: "current",
    userId: data.user_id,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    ethnicity: data.ethnicity,
    skinType: data.skin_type,
    allergies: data.allergies ?? [],
    medications: data.medications ?? [],
    medicalConditions: data.medical_conditions ?? [],
    previousTreatments: data.previous_treatments ?? [],
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

export async function upsertMedicalProfile(userId: string, input: MedicalProfileInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("medical_profiles").upsert(
    {
      user_id: userId,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      ethnicity: input.ethnicity,
      skin_type: input.skinType,
      allergies: input.allergies,
      medications: input.medications,
      medical_conditions: input.medicalConditions,
      previous_treatments: input.previousTreatments,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
