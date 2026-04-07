import type { Gender, Ethnicity, SkinType } from "../domain/medical-profile";
import { parseMedicalProfile } from "../domain/medical-profile";
import type { MedicalProfile } from "../domain/medical-profile";
import { postgresDateOnlyToLocalDate } from "../lib/date-only";
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
    dateOfBirth: postgresDateOnlyToLocalDate(data.date_of_birth),
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
  const updatedAt = new Date().toISOString();
  const row = {
    date_of_birth: input.dateOfBirth,
    gender: input.gender,
    ethnicity: input.ethnicity,
    skin_type: input.skinType,
    allergies: input.allergies,
    medications: input.medications,
    medical_conditions: input.medicalConditions,
    previous_treatments: input.previousTreatments,
    notes: input.notes,
    updated_at: updatedAt,
  };

  /**
   * Prefer UPDATE + INSERT instead of PostgREST `upsert` so edits reliably persist under RLS.
   * (Merge-duplicates upsert can report success without applying changes in some setups.)
   */
  const { data: existing, error: selectError } = await supabase
    .from("medical_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("medical_profiles")
      .update(row)
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }
    if (!updated) {
      throw new Error(
        "Medical profile was not updated (no matching row). Try signing out and back in, or check database policies for medical_profiles.",
      );
    }
    return;
  }

  const { error: insertError } = await supabase.from("medical_profiles").insert({
    user_id: userId,
    ...row,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
