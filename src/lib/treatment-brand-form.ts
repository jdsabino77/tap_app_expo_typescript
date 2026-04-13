import type { LaserType, ServiceType, ServiceTypeBrand } from "../domain/reference-content";

/** Brands configured for the selected service type (injectable / both forms). */
export function brandsForServiceTypeName(
  serviceTypeName: string,
  serviceTypes: ServiceType[],
  brands: ServiceTypeBrand[],
): ServiceTypeBrand[] {
  const st = serviceTypes.find(
    (s) => s.name.trim().toLowerCase() === serviceTypeName.trim().toLowerCase(),
  );
  if (!st) {
    return [];
  }
  return brands
    .filter((b) => b.serviceTypeId === st.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function resolveBrandPickFromSaved(
  savedBrand: string,
  injectableBrandRows: ServiceTypeBrand[],
  laserRows: LaserType[],
  useLaserDeviceBrandPicker: boolean,
): { rowId: string; otherDetail: string } {
  const s = savedBrand.trim();
  if (useLaserDeviceBrandPicker) {
    if (!s) {
      return { rowId: "", otherDetail: "" };
    }
    const exact = laserRows.find((l) => l.name.toLowerCase() === s.toLowerCase());
    if (exact && !exact.isOther) {
      return { rowId: exact.id, otherDetail: "" };
    }
    const other = laserRows.find((l) => l.isOther);
    if (other) {
      return { rowId: other.id, otherDetail: s === "Other" ? "" : s };
    }
    return { rowId: "", otherDetail: s };
  }
  if (!s) {
    return { rowId: "", otherDetail: "" };
  }
  const exact = injectableBrandRows.find((b) => b.name.toLowerCase() === s.toLowerCase());
  if (exact && !exact.isOther) {
    return { rowId: exact.id, otherDetail: "" };
  }
  const other = injectableBrandRows.find((b) => b.isOther);
  if (other) {
    return { rowId: other.id, otherDetail: s === "Other" ? "" : s };
  }
  return { rowId: "", otherDetail: s };
}

/** Value stored on `treatments.brand`. */
export function buildTreatmentBrandValue(
  useLaserDeviceBrandPicker: boolean,
  brandRowId: string,
  brandOtherDetail: string,
  injectableBrandRows: ServiceTypeBrand[],
  laserRows: LaserType[],
): string {
  if (useLaserDeviceBrandPicker) {
    const row = laserRows.find((l) => l.id === brandRowId);
    if (!row) {
      return brandOtherDetail.trim();
    }
    if (row.isOther) {
      return brandOtherDetail.trim() || "Other";
    }
    return row.name;
  }
  const row = injectableBrandRows.find((b) => b.id === brandRowId);
  if (!row) {
    return brandOtherDetail.trim();
  }
  if (row.isOther) {
    return brandOtherDetail.trim() || "Other";
  }
  return row.name;
}
