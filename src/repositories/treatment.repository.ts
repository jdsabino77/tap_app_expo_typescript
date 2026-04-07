import type { Treatment, TreatmentType } from "../domain/treatment";
import { treatmentFromRow, type TreatmentRow } from "../mappers/treatment.mapper";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type CreateTreatmentInput = {
  treatmentType: TreatmentType;
  serviceType: string;
  brand: string;
  treatmentAreas: string[];
  units: number;
  /** Empty or null → stored as null */
  providerId: string | null;
  treatmentDate: Date;
  notes: string;
  cost: number | null;
};

export async function fetchTreatmentsForCurrentUser(): Promise<Treatment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("treatment_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as TreatmentRow[]).map(treatmentFromRow);
}

export async function fetchTreatmentById(id: string): Promise<Treatment | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return treatmentFromRow(data as TreatmentRow);
}

async function adjustTreatmentCount(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  delta: number,
): Promise<void> {
  if (delta === 0) {
    return;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("treatment_count")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return;
  }
  const next = Math.max(0, (data?.treatment_count ?? 0) + delta);
  await supabase
    .from("profiles")
    .update({ treatment_count: next, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function createTreatmentForCurrentUser(input: CreateTreatmentInput): Promise<Treatment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;
  const providerId =
    input.providerId && input.providerId.trim() !== "" ? input.providerId.trim() : null;

  const row = {
    user_id: uid,
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
  };

  const { data, error } = await supabase.from("treatments").insert(row).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  void adjustTreatmentCount(supabase, uid, 1);

  return treatmentFromRow(data as TreatmentRow);
}

export type UpdateTreatmentInput = CreateTreatmentInput;

export async function updateTreatmentForCurrentUser(
  id: string,
  input: UpdateTreatmentInput,
): Promise<Treatment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;
  const providerId =
    input.providerId && input.providerId.trim() !== "" ? input.providerId.trim() : null;

  const row = {
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    treatment_areas: input.treatmentAreas,
    units: input.units,
    provider_id: providerId,
    treatment_date: input.treatmentDate.toISOString(),
    notes: input.notes.trim(),
    cost: input.cost,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("treatments")
    .update(row)
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Treatment not found or access denied.");
  }
  return treatmentFromRow(data as TreatmentRow);
}

export async function deleteTreatmentForCurrentUser(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in.");
  }
  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("treatments")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Treatment not found or access denied.");
  }

  void adjustTreatmentCount(supabase, uid, -1);
}
