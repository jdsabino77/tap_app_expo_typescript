import type { Treatment } from "../domain/treatment";

/** Internal key when neither EBD category nor service type text is present. */
export const TREATMENT_SUBTYPE_NONE = "__none__";

/**
 * Subtype for filtering: resolved EBD category when non-empty, otherwise trimmed `serviceType`,
 * or {@link TREATMENT_SUBTYPE_NONE} if both are empty.
 */
export function treatmentSubtypeKey(t: Treatment): string {
  const cat = t.ebdTreatmentCategory?.trim();
  if (cat) {
    return cat;
  }
  const s = t.serviceType.trim();
  return s || TREATMENT_SUBTYPE_NONE;
}

export function distinctSortedSubtypeKeys(treatments: Treatment[]): string[] {
  const set = new Set<string>();
  for (const t of treatments) {
    set.add(treatmentSubtypeKey(t));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterTreatmentsByListSelections(
  items: Treatment[],
  selectedTreatmentTypeSlugs: string[],
  selectedSubtypeKeys: string[],
): Treatment[] {
  const typeFilter = selectedTreatmentTypeSlugs.length > 0;
  const subtypeFilter = selectedSubtypeKeys.length > 0;
  return items.filter((t) => {
    if (typeFilter && !selectedTreatmentTypeSlugs.includes(t.treatmentType)) {
      return false;
    }
    if (subtypeFilter && !selectedSubtypeKeys.includes(treatmentSubtypeKey(t))) {
      return false;
    }
    return true;
  });
}
