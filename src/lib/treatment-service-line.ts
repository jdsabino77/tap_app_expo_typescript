import type { Appointment } from "../domain/appointment";
import type { Treatment, TreatmentType } from "../domain/treatment";
import { appStrings } from "../strings/appStrings";

export type EbdLineLabels = {
  laserModality: string;
  photofacialModality: string;
};

/** User-facing label for the top-level `treatments.treatment_type` value. */
export function treatmentTypeDisplayLabel(treatmentType: TreatmentType): string {
  return treatmentType === "laser"
    ? appStrings.treatmentTypeEnergyBasedDevicesLabel
    : appStrings.treatmentTypeInjectableLabel;
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
  if (
    t.treatmentType === "laser" &&
    t.ebdIndicationId &&
    t.ebdModality &&
    t.ebdTreatmentCategory
  ) {
    return ebdLine(t.ebdModality, t.ebdTreatmentCategory, labels);
  }
  return t.serviceType;
}

export function appointmentServiceLine(a: Appointment, labels: EbdLineLabels): string {
  if (
    a.appointmentKind === "treatment" &&
    a.treatmentType === "laser" &&
    a.ebdIndicationId &&
    a.ebdModality &&
    a.ebdTreatmentCategory
  ) {
    return ebdLine(a.ebdModality, a.ebdTreatmentCategory, labels);
  }
  return a.serviceType;
}
