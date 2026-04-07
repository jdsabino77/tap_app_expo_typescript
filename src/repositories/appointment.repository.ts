import type { Appointment, AppointmentKind, AppointmentStatus } from "../domain/appointment";
import type { TreatmentType } from "../domain/treatment";
import { appointmentFromRow, type AppointmentRowFromDb } from "../mappers/appointment.mapper";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

const APPOINTMENT_SELECT = "*, providers(name)";

export type CreateAppointmentInput = {
  appointmentKind: AppointmentKind;
  treatmentType: TreatmentType | null;
  serviceType: string;
  brand: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  providerId: string | null;
  notes: string;
  status?: AppointmentStatus;
  externalRef?: string | null;
};

export async function fetchAppointmentsForCurrentUser(): Promise<Appointment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return [];
  }
  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("user_id", uid)
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as AppointmentRowFromDb[]).map(appointmentFromRow);
}

/** Scheduled appointments with `scheduled_at` strictly after `after` (exclusive), ascending. */
export async function fetchUpcomingAppointmentsForCurrentUser(
  after: Date,
  limit: number,
): Promise<Appointment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return [];
  }
  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("user_id", uid)
    .eq("status", "scheduled")
    .gt("scheduled_at", after.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as AppointmentRowFromDb[]).map(appointmentFromRow);
}

export async function fetchAppointmentByIdForCurrentUser(id: string): Promise<Appointment | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return appointmentFromRow(data as AppointmentRowFromDb);
}

export type UpdateAppointmentInput = {
  appointmentKind: AppointmentKind;
  treatmentType: TreatmentType | null;
  serviceType: string;
  brand: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  providerId: string | null;
  notes: string;
};

export async function updateAppointmentForCurrentUser(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in");
  }

  const row = {
    appointment_kind: input.appointmentKind,
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    scheduled_at: input.scheduledAt.toISOString(),
    duration_minutes: input.durationMinutes,
    provider_id: input.providerId,
    notes: input.notes.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("appointments")
    .update(row)
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .select(APPOINTMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return appointmentFromRow(data as AppointmentRowFromDb);
}

export async function createAppointmentForCurrentUser(input: CreateAppointmentInput): Promise<Appointment> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not signed in");
  }
  const uid = userData.user.id;

  const row = {
    user_id: uid,
    appointment_kind: input.appointmentKind,
    treatment_type: input.treatmentType,
    service_type: input.serviceType.trim(),
    brand: input.brand.trim(),
    scheduled_at: input.scheduledAt.toISOString(),
    duration_minutes: input.durationMinutes,
    provider_id: input.providerId,
    notes: input.notes.trim(),
    status: input.status ?? "scheduled",
    external_ref: input.externalRef ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select(APPOINTMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return appointmentFromRow(data as AppointmentRowFromDb);
}
