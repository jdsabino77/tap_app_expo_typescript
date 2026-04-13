import type { Appointment } from "../domain/appointment";
import type { Treatment, TreatmentType } from "../domain/treatment";
import type { TreatmentTypeCatalogRow } from "../domain/reference-content";
import { appStrings } from "../strings/appStrings";

export type EbdLineLabels = {
  laserModality: string;
  photofacialModality: string;
};

function titleCaseSlug(slug: string): string {
  return slug
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** User-facing label for the top-level `treatments.treatment_type` slug. */
export function treatmentTypeDisplayLabel(
  treatmentType: TreatmentType,
  catalog?: TreatmentTypeCatalogRow[],
): string {
  const row = catalog?.find((r) => r.slug === treatmentType);
  if (row?.name) {
    return row.name;
  }
  if (treatmentType === "laser") {
    return appStrings.treatmentTypeEnergyBasedDevicesLabel;
  }
  if (treatmentType === "injectable") {
    return appStrings.treatmentTypeInjectableLabel;
  }
  if (treatmentType === "skin_treatments") {
    return appStrings.treatmentTypeSkinTreatmentsLabel;
  }
  return titleCaseSlug(treatmentType);
}

function ebdLine(
  modality: "laser" | "photofacial",
  category: string,
  labels: EbdLineLabels,
): string {
  const mod = modality === "laser" ? labels.laserModality : labels.photofacialModality;
  return `${mod} · ${category}`;
}

/** Second line segment for home/calendar: EBD hierarchy or legacy `serviceType` text. */
export function treatmentServiceLine(t: Treatment, labels: EbdLineLabels): string {
  if (t.ebdIndicationId && t.ebdModality && t.ebdTreatmentCategory) {
    return ebdLine(t.ebdModality, t.ebdTreatmentCategory, labels);
  }
  return t.serviceType;
}

export function appointmentServiceLine(a: Appointment, labels: EbdLineLabels): string {
  if (
    a.appointmentKind === "treatment" &&
    a.ebdIndicationId &&
    a.ebdModality &&
    a.ebdTreatmentCategory
  ) {
    return ebdLine(a.ebdModality, a.ebdTreatmentCategory, labels);
  }
  return a.serviceType;
}
