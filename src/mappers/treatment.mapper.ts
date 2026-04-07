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
  created_at?: string;
  updated_at?: string;
};

export function treatmentFromRow(row: TreatmentRow): Treatment {
  return parseTreatment({
    id: row.id,
    userId: row.user_id,
    treatmentType: row.treatment_type,
    serviceType: row.service_type,
    brand: row.brand ?? "",
    treatmentAreas: row.treatment_areas ?? [],
    units: row.units ?? 0,
    providerId: row.provider_id ?? "",
    treatmentDate: row.treatment_date,
    notes: row.notes ?? "",
    cost: row.cost == null ? null : typeof row.cost === "string" ? parseFloat(row.cost) : row.cost,
    photoUrls: row.photo_urls ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
