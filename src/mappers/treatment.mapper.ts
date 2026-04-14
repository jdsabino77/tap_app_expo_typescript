import type { EbdModality } from "../domain/ebd-modality";
import type { Treatment } from "../domain/treatment";
import { parseTreatment } from "../domain/treatment";

export type TreatmentRow = {
  id: string;
  user_id: string;
  treatment_type: string;
  service_type: string;
  brand: string;
  treatment_areas: string[] | null;
  units: number;
  provider_id: string | null;
  treatment_date: string;
  notes: string | null;
  cost: string | number | null;
  photo_urls?: string[] | null;
  photo_captured_at?: string[] | null;
  created_at?: string;
  updated_at?: string;
  ebd_indication_id?: string | null;
  ebd_indications?: { id: string; modality: string; name: string } | null;
};

function ebdFieldsFromRow(row: TreatmentRow): {
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

export function treatmentFromRow(row: TreatmentRow): Treatment {
  const ebd = ebdFieldsFromRow(row);
  return parseTreatment({
    id: row.id,
    userId: row.user_id,
    treatmentType: row.treatment_type,
    serviceType: row.service_type,
    brand: row.brand ?? "",
    ebdIndicationId: ebd.ebdIndicationId,
    ebdModality: ebd.ebdModality,
    ebdTreatmentCategory: ebd.ebdTreatmentCategory,
    treatmentAreas: row.treatment_areas ?? [],
    units: row.units ?? 0,
    providerId: row.provider_id ?? "",
    treatmentDate: row.treatment_date,
    notes: row.notes ?? "",
    cost: row.cost == null ? null : typeof row.cost === "string" ? parseFloat(row.cost) : row.cost,
    photoUrls: row.photo_urls ?? [],
    photoCapturedAt: (row.photo_captured_at ?? []).map((s) => new Date(s)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
