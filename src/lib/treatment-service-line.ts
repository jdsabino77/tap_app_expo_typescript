import type { Appointment } from "../domain/appointment";
import type { Treatment } from "../domain/treatment";

export type EbdLineLabels = {
  ebdType: string;
  laserModality: string;
  photofacialModality: string;
};

function ebdLine(
  modality: "laser" | "photofacial",
  category: string,
  labels: EbdLineLabels,
): string {
  const mod = modality === "laser" ? labels.laserModality : labels.photofacialModality;
  return `${labels.ebdType} · ${mod} · ${category}`;
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
