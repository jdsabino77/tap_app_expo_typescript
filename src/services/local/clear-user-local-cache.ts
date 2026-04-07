import { clearProvidersListCache } from "./providers-list-cache";
import { clearReferenceCatalogBundleCache } from "./reference-catalog-cache";
import { clearTreatmentsListCache } from "./treatments-list-cache";
import { clearAllOutboxForUser } from "./write-queue";

/** Clears list caches, reference catalog cache, and pending writes (call before sign-out once you have userId). */
export async function clearUserLocalCache(userId: string): Promise<void> {
  await clearTreatmentsListCache(userId);
  await clearProvidersListCache(userId);
  await clearAllOutboxForUser(userId);
  await clearReferenceCatalogBundleCache();
}
