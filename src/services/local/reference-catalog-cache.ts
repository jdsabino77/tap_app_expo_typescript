import {
  type ReferenceCatalogBundle,
  parseReferenceCatalogBundleJson,
} from "../../domain/reference-content";
import { kvDelete, kvRead, kvWrite } from "./kv-async";

const CACHE_KEY = "reference_catalog_bundle_v2";

export async function saveReferenceCatalogBundleToCache(bundle: ReferenceCatalogBundle): Promise<void> {
  await kvWrite(CACHE_KEY, JSON.stringify(bundle));
}

export async function loadReferenceCatalogBundleFromCache(): Promise<ReferenceCatalogBundle | null> {
  const raw = await kvRead(CACHE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return parseReferenceCatalogBundleJson(raw);
  } catch {
    return null;
  }
}

export async function clearReferenceCatalogBundleCache(): Promise<void> {
  await kvDelete(CACHE_KEY);
}
