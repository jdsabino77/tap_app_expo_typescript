import type { EbdIndicationLaserTypeLink, LaserType } from "../domain/reference-content";

/**
 * Laser device rows allowed for an EBD category (`ebd_indication_laser_types`).
 * Empty `links` (e.g. pre-migration cache) → full `laserTypes` list.
 * When links exist globally but none for `ebdIndicationId` → `isOther` rows only.
 */
export function laserTypesForEbdIndication(
  ebdIndicationId: string,
  laserTypes: LaserType[],
  links: EbdIndicationLaserTypeLink[],
): LaserType[] {
  if (!links.length) {
    return laserTypes;
  }
  const trimmed = ebdIndicationId.trim();
  if (!trimmed) {
    return laserTypes;
  }
  const byLaserId = new Map(laserTypes.map((l) => [l.id, l]));
  const forIndication = links
    .filter((x) => x.ebdIndicationId === trimmed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out: LaserType[] = [];
  const seen = new Set<string>();
  for (const link of forIndication) {
    const lt = byLaserId.get(link.laserTypeId);
    if (lt && !seen.has(lt.id)) {
      seen.add(lt.id);
      out.push(lt);
    }
  }
  if (out.length > 0) {
    return out;
  }
  return laserTypes.filter((l) => l.isOther);
}
