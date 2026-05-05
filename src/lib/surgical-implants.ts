import type { ServiceType, SurgicalProcedure } from "../domain/reference-content";

/** `service_types.name` seed for Surgical modality (issue #52). */
export const SURGICAL_IMPLANTS_SERVICE_NAME = "Implants";

export function isSurgicalImplantsFlow(treatmentTypeSlug: string, serviceTypeName: string): boolean {
  return (
    treatmentTypeSlug.trim().toLowerCase() === "surgical" &&
    serviceTypeName.trim().toLowerCase() === SURGICAL_IMPLANTS_SERVICE_NAME.toLowerCase()
  );
}

export function surgicalProceduresForImplantsService(
  serviceTypes: ServiceType[],
  procedures: SurgicalProcedure[],
): SurgicalProcedure[] {
  const implants = serviceTypes.find(
    (s) => s.name.trim().toLowerCase() === SURGICAL_IMPLANTS_SERVICE_NAME.toLowerCase(),
  );
  if (!implants) {
    return [];
  }
  return procedures.filter((p) => p.serviceTypeId === implants.id);
}
