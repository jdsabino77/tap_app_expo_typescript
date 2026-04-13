import { useCallback, useEffect, useState } from "react";
import type { ReferenceCatalogBundle } from "../domain/reference-content";
import { fetchReferenceCatalogBundle } from "../repositories/catalog.repository";
import { useSession } from "../store/session";

const emptyBundle: ReferenceCatalogBundle = {
  laserTypes: [],
  serviceTypes: [],
  serviceTypeBrands: [],
  treatmentTypes: [],
  treatmentAreas: [],
  providerServices: [],
  ebdIndications: [],
  ebdIndicationLaserTypeLinks: [],
};

export function useReferenceCatalogs() {
  const { supabaseEnabled } = useSession();
  const [bundle, setBundle] = useState<ReferenceCatalogBundle>(emptyBundle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) {
      setBundle(emptyBundle);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const b = await fetchReferenceCatalogBundle();
      setBundle(b);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalogs");
      setBundle(emptyBundle);
    } finally {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    laserTypes: bundle.laserTypes,
    serviceTypes: bundle.serviceTypes,
    serviceTypeBrands: bundle.serviceTypeBrands,
    treatmentTypes: bundle.treatmentTypes,
    treatmentAreas: bundle.treatmentAreas,
    providerServices: bundle.providerServices,
    ebdIndications: bundle.ebdIndications,
    ebdIndicationLaserTypeLinks: bundle.ebdIndicationLaserTypeLinks,
    loading,
    error,
    refresh,
  };
}
