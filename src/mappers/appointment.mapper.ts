import { parseAppointment, type Appointment } from "../domain/appointment";
import type { EbdModality } from "../domain/ebd-modality";
import type { TreatmentType } from "../domain/treatment";

export type AppointmentRow = {
  id: string;
  user_id: string;
  appointment_kind: string;
  treatment_type: string | null;
  service_type: string;
  brand: string;
  scheduled_at: string;
  duration_minutes: number | null;
  provider_id: string | null;
  notes: string;
  status: string;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
  ebd_indication_id?: string | null;
  ebd_indications?: { id: string; modality: string; name: string } | null;
};

/** Present when selecting with `providers (name)` embed. */
export type AppointmentRowFromDb = AppointmentRow & {
  providers?: { name: string | null } | null;
};

function providerNameFromJoin(row: AppointmentRowFromDb): string | null {
  const n = row.providers?.name;
  if (typeof n !== "string") {
    return null;
  }
  const t = n.trim();
  return t.length > 0 ? t : null;
}

function ebdFromAppointmentRow(row: AppointmentRowFromDb): {
  ebdIndicationId: string | null;
  ebdModality: EbdModality | null;
  ebdTreatmentCategory: string;
} {
  const embed = row.ebd_indications;
  if (embed && typeof embed === "object") {
    const modality =
      embed.modality === "laser" || embed.modality === "photofacial" ? embed.modality : null;
    return {
      ebdIndicationId: embed.id ?? row.ebd_indication_id ?? null,
      ebdModality: modality,
      ebdTreatmentCategory: embed.name ?? "",
    };
  }
  return {
    ebdIndicationId: row.ebd_indication_id ?? null,
    ebdModality: null,
    ebdTreatmentCategory: "",
  };
}

export function appointmentFromRow(row: AppointmentRowFromDb): Appointment {
  const ebd = ebdFromAppointmentRow(row);
  return parseAppointment({
    id: row.id,
    userId: row.user_id,
    appointmentKind: row.appointment_kind,
    treatmentType: row.treatment_type as TreatmentType | null,
    serviceType: row.service_type ?? "",
    brand: row.brand ?? "",
    ebdIndicationId: ebd.ebdIndicationId,
    ebdModality: ebd.ebdModality,
    ebdTreatmentCategory: ebd.ebdTreatmentCategory,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    providerId: row.provider_id,
    providerName: providerNameFromJoin(row),
    notes: row.notes ?? "",
    status: row.status,
    externalRef: row.external_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
