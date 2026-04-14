import type { Treatment } from "../domain/treatment";

export type PhotoLibraryFlatItem = {
  treatmentId: string;
  pathIndex: number;
  storagePath: string;
  sortDate: Date;
};

export function flattenTreatmentPhotosForLibrary(treatments: Treatment[]): PhotoLibraryFlatItem[] {
  const out: PhotoLibraryFlatItem[] = [];
  for (const t of treatments) {
    for (let i = 0; i < t.photoUrls.length; i++) {
      const sortDate = t.photoCapturedAt[i] ?? t.treatmentDate;
      out.push({
        treatmentId: t.id,
        pathIndex: i,
        storagePath: t.photoUrls[i],
        sortDate,
      });
    }
  }
  out.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  return out;
}

/** Serialized in compare route search params. */
export type PhotoCompareParam = { treatmentId: string; pathIndex: number };

export function encodeCompareSelection(items: PhotoCompareParam[]): string {
  return JSON.stringify(items);
}

export function decodeCompareSelection(raw: string | undefined): PhotoCompareParam[] {
  if (!raw || typeof raw !== "string") {
    return [];
  }
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    const out: PhotoCompareParam[] = [];
    for (const el of data) {
      if (
        el &&
        typeof el === "object" &&
        "treatmentId" in el &&
        "pathIndex" in el &&
        typeof (el as PhotoCompareParam).treatmentId === "string" &&
        typeof (el as PhotoCompareParam).pathIndex === "number"
      ) {
        out.push({
          treatmentId: (el as PhotoCompareParam).treatmentId,
          pathIndex: (el as PhotoCompareParam).pathIndex,
        });
      }
    }
    return out.slice(0, 4);
  } catch {
    return [];
  }
}
