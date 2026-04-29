import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { format, isValid, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CatalogItemSelect } from "../../../../src/components/catalog-item-select";
import { TreatmentTypeSelectGrid } from "../../../../src/components/treatment-type-select-grid";
import { TreatmentPhotoViewer } from "../../../../src/components/treatment-photo-viewer";
import { CatalogLoadState, TreatmentAreaCatalogChips } from "../../../../src/components/catalog-suggestions";
import { TreatmentBrandFields } from "../../../../src/components/treatment-brand-fields";
import type { Provider } from "../../../../src/domain/provider";
import type { EbdModality } from "../../../../src/domain/ebd-modality";
import {
  ebdIndicationsForModality,
  filterServiceTypesForTreatment,
  treatmentTypeFlagsForSlug,
} from "../../../../src/domain/reference-content";
import { laserTypesForEbdIndication } from "../../../../src/lib/treatment-ebd-laser-types";
import {
  brandsForServiceTypeName,
  buildTreatmentBrandValue,
  resolveBrandPickFromSaved,
} from "../../../../src/lib/treatment-brand-form";
import type { TreatmentType } from "../../../../src/domain/treatment";
import { useReferenceCatalogs } from "../../../../src/hooks/useReferenceCatalogs";
import { formatDisplayDate } from "../../../../src/lib/datetime";
import { pickTreatmentImages, type TreatmentPhotoPick } from "../../../../src/lib/pick-treatment-photos";
import { isWriteQueuedError } from "../../../../src/lib/write-queued-error";
import {
  fetchProviderByIdForCurrentUser,
  fetchProvidersForCurrentUser,
} from "../../../../src/repositories/provider.repository";
import {
  fetchTreatmentById,
  fetchTreatmentPhotoSignedUrls,
  updateTreatmentForCurrentUser,
} from "../../../../src/repositories/treatment.repository";
import { MAX_TREATMENT_PHOTOS } from "../../../../src/services/supabase/treatment-photos";
import { appStrings } from "../../../../src/strings/appStrings";
import { useSession } from "../../../../src/store/session";
import { colors } from "../../../../src/theme/tokens";

function parseDateInput(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const d = parseISO(t);
  return isValid(d) ? d : null;
}

export default function EditTreatmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const catalogs = useReferenceCatalogs();
  useFocusEffect(
    useCallback(() => {
      void catalogs.refresh();
    }, [catalogs.refresh]),
  );
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingTreatment, setLoadingTreatment] = useState(true);

  const [treatmentType, setTreatmentType] = useState<TreatmentType>("injectable");
  const [serviceType, setServiceType] = useState("");
  const [ebdModality, setEbdModality] = useState<EbdModality>("laser");
  const [ebdIndicationId, setEbdIndicationId] = useState("");
  const [brandRowId, setBrandRowId] = useState("");
  const [brandOtherDetail, setBrandOtherDetail] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [unitsText, setUnitsText] = useState("0");
  const [providerId, setProviderId] = useState("");
  const [dateStr, setDateStr] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [costText, setCostText] = useState("");

  const initialPathsRef = useRef<string[]>([]);
  const [committedPaths, setCommittedPaths] = useState<string[]>([]);
  const [localPicks, setLocalPicks] = useState<TreatmentPhotoPick[]>([]);
  /** Capture dates for committed storage paths (from server). */
  const [photoDateByPath, setPhotoDateByPath] = useState<Record<string, Date>>({});
  const [signedByPath, setSignedByPath] = useState<Record<string, string>>({});
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const treatmentBrandSnapshotRef = useRef<{
    savedBrand: string;
    treatmentType: TreatmentType;
    serviceType: string;
  } | null>(null);
  const lastBrandHydrateKeyRef = useRef<string>("");

  const typeFlags = useMemo(
    () => treatmentTypeFlagsForSlug(treatmentType, catalogs.treatmentTypes ?? []),
    [treatmentType, catalogs.treatmentTypes],
  );

  const treatmentDatePreview = useMemo(() => parseDateInput(dateStr), [dateStr]);
  const useEbdLaser =
    typeFlags.useEbdServiceFlow && (catalogs.ebdIndications?.length ?? 0) > 0;
  const useLaserPicker = typeFlags.useLaserDeviceBrandPicker;

  useEffect(() => {
    if (catalogs.loading || !catalogs.treatmentTypes?.length) {
      return;
    }
    setTreatmentType((prev) =>
      catalogs.treatmentTypes.some((x) => x.slug === prev)
        ? prev
        : catalogs.treatmentTypes[0].slug,
    );
  }, [catalogs.loading, catalogs.treatmentTypes]);

  const filteredServiceTypes = useMemo(
    () =>
      useEbdLaser
        ? []
        : filterServiceTypesForTreatment(catalogs.serviceTypes, treatmentType),
    [catalogs.serviceTypes, treatmentType, useEbdLaser],
  );

  const filteredEbdIndications = useMemo(
    () => ebdIndicationsForModality(catalogs.ebdIndications ?? [], ebdModality),
    [catalogs.ebdIndications, ebdModality],
  );

  useEffect(() => {
    if (useEbdLaser) {
      return;
    }
    if (filteredServiceTypes.length === 0) {
      return;
    }
    setServiceType((prev) => {
      const ok = filteredServiceTypes.some(
        (s) => s.name.trim().toLowerCase() === prev.trim().toLowerCase(),
      );
      return ok ? prev : "";
    });
  }, [treatmentType, filteredServiceTypes, useEbdLaser]);

  useEffect(() => {
    if (!useEbdLaser || !ebdIndicationId.trim()) {
      return;
    }
    const ok = filteredEbdIndications.some((r) => r.id === ebdIndicationId);
    if (!ok) {
      setEbdIndicationId("");
      setServiceType("");
    }
  }, [ebdModality, filteredEbdIndications, useEbdLaser, ebdIndicationId]);

  const prevModalityRef = useRef<TreatmentType | null>(null);
  const prevServiceRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevModalityRef.current !== null && prevModalityRef.current !== treatmentType) {
      setBrandRowId("");
      setBrandOtherDetail("");
      treatmentBrandSnapshotRef.current = null;
    }
    if (prevServiceRef.current !== null && prevServiceRef.current !== serviceType) {
      setBrandRowId("");
      setBrandOtherDetail("");
      treatmentBrandSnapshotRef.current = null;
    }
    prevModalityRef.current = treatmentType;
    prevServiceRef.current = serviceType;
  }, [treatmentType, serviceType]);

  const injectableBrandOptions = useMemo(
    () => brandsForServiceTypeName(serviceType, catalogs.serviceTypes, catalogs.serviceTypeBrands),
    [serviceType, catalogs.serviceTypes, catalogs.serviceTypeBrands],
  );

  const ebdLaserPickerTypes = useMemo(() => {
    if (!useEbdLaser || !ebdIndicationId.trim()) {
      return catalogs.laserTypes;
    }
    return laserTypesForEbdIndication(
      ebdIndicationId,
      catalogs.laserTypes,
      catalogs.ebdIndicationLaserTypeLinks ?? [],
    );
  }, [useEbdLaser, ebdIndicationId, catalogs.laserTypes, catalogs.ebdIndicationLaserTypeLinks]);

  useEffect(() => {
    if (!useEbdLaser || !ebdIndicationId.trim()) {
      return;
    }
    const allowed = laserTypesForEbdIndication(
      ebdIndicationId,
      catalogs.laserTypes,
      catalogs.ebdIndicationLaserTypeLinks ?? [],
    );
    if (brandRowId && !allowed.some((l) => l.id === brandRowId)) {
      setBrandRowId(allowed.find((l) => l.isOther)?.id ?? "");
      setBrandOtherDetail("");
    }
  }, [useEbdLaser, ebdIndicationId, catalogs.laserTypes, catalogs.ebdIndicationLaserTypeLinks, brandRowId]);

  useEffect(() => {
    lastBrandHydrateKeyRef.current = "";
  }, [id]);

  useEffect(() => {
    if (loadingTreatment || catalogs.loading) {
      return;
    }
    const snap = treatmentBrandSnapshotRef.current;
    if (!snap) {
      return;
    }
    if (snap.serviceType !== serviceType || snap.treatmentType !== treatmentType) {
      return;
    }
    const inj = injectableBrandOptions;
    const laserListForKey =
      useLaserPicker && useEbdLaser && ebdIndicationId.trim()
        ? laserTypesForEbdIndication(
            ebdIndicationId,
            catalogs.laserTypes,
            catalogs.ebdIndicationLaserTypeLinks ?? [],
          )
        : catalogs.laserTypes;
    const brandIdsKey = useLaserPicker
      ? laserListForKey.map((l) => l.id).join(",")
      : inj.map((b) => b.id).join(",");
    const hydrateKey = `${id}:${brandIdsKey}:${snap.savedBrand}`;
    if (lastBrandHydrateKeyRef.current === hydrateKey) {
      return;
    }
    let { rowId, otherDetail } = resolveBrandPickFromSaved(
      snap.savedBrand,
      inj,
      catalogs.laserTypes,
      useLaserPicker,
    );
    if (useLaserPicker && useEbdLaser && ebdIndicationId.trim()) {
      const allowed = laserTypesForEbdIndication(
        ebdIndicationId,
        catalogs.laserTypes,
        catalogs.ebdIndicationLaserTypeLinks ?? [],
      );
      if (rowId && !allowed.some((l) => l.id === rowId)) {
        const other = allowed.find((l) => l.isOther);
        rowId = other?.id ?? "";
        otherDetail = "";
      }
    }
    setBrandRowId(rowId);
    setBrandOtherDetail(otherDetail);
    lastBrandHydrateKeyRef.current = hydrateKey;
  }, [
    id,
    loadingTreatment,
    catalogs.loading,
    catalogs.laserTypes,
    catalogs.ebdIndicationLaserTypeLinks,
    ebdIndicationId,
    serviceType,
    treatmentType,
    useEbdLaser,
    useLaserPicker,
    injectableBrandOptions,
  ]);

  const legacySelectedAreas = useMemo(() => {
    const catalogLower = new Set(
      catalogs.treatmentAreas.map((a) => a.name.trim().toLowerCase()),
    );
    return selectedAreas.filter((s) => !catalogLower.has(s.trim().toLowerCase()));
  }, [selectedAreas, catalogs.treatmentAreas]);

  const mergeProviderForPicker = useCallback(
    async (list: Provider[], currentPid: string | null) => {
      if (!currentPid || list.some((p) => p.id === currentPid)) {
        return list;
      }
      try {
        const extra = await fetchProviderByIdForCurrentUser(currentPid);
        if (extra) {
          return [...list, extra.provider];
        }
      } catch {
        /* ignore */
      }
      return list;
    },
    [],
  );

  const loadProviders = useCallback(
    async (currentPid: string | null) => {
      if (!supabaseEnabled) {
        return;
      }
      setLoadingProviders(true);
      try {
        const list = await fetchProvidersForCurrentUser();
        setProviders(await mergeProviderForPicker(list, currentPid));
      } catch {
        setProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    },
    [supabaseEnabled, mergeProviderForPicker],
  );

  useEffect(() => {
    if (!supabaseEnabled || !id) {
      setLoadingTreatment(false);
      return;
    }
    let cancelled = false;
    setLoadingTreatment(true);
    setLoadErr(null);
    void fetchTreatmentById(id)
      .then(async (t) => {
        if (cancelled || !t) {
          if (!cancelled) {
            setLoadErr("Treatment not found.");
          }
          return;
        }
        setTreatmentType(t.treatmentType);
        setServiceType(t.serviceType);
        const loadedEbd =
          treatmentTypeFlagsForSlug(t.treatmentType, []).useEbdServiceFlow && t.ebdIndicationId;
        if (loadedEbd) {
          setEbdIndicationId(t.ebdIndicationId ?? "");
          setEbdModality(t.ebdModality ?? "laser");
        } else {
          setEbdIndicationId("");
          setEbdModality("laser");
        }
        treatmentBrandSnapshotRef.current = {
          savedBrand: t.brand,
          treatmentType: t.treatmentType,
          serviceType: t.serviceType,
        };
        setBrandRowId("");
        setBrandOtherDetail("");
        setSelectedAreas([...t.treatmentAreas]);
        setUnitsText(String(t.units));
        const pid = t.providerId && t.providerId !== "" ? t.providerId : "";
        setProviderId(pid);
        setDateStr(format(t.treatmentDate, "yyyy-MM-dd"));
        setNotes(t.notes ?? "");
        setCostText(t.cost != null ? String(t.cost) : "");
        const paths = [...t.photoUrls];
        initialPathsRef.current = paths;
        setCommittedPaths(paths);
        const nextDates: Record<string, Date> = {};
        paths.forEach((p, i) => {
          nextDates[p] = t.photoCapturedAt[i] ?? t.treatmentDate;
        });
        setPhotoDateByPath(nextDates);
        setLocalPicks([]);
        void loadProviders(pid);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTreatment(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, supabaseEnabled, loadProviders]);

  useEffect(() => {
    if (loadingTreatment || catalogs.loading || !typeFlags.useEbdServiceFlow) {
      return;
    }
    if ((catalogs.ebdIndications?.length ?? 0) === 0 || ebdIndicationId.trim() !== "") {
      return;
    }
    const st = serviceType.trim();
    if (!st) {
      return;
    }
    const match = catalogs.ebdIndications?.find((i) => i.name.trim() === st);
    if (match) {
      setEbdIndicationId(match.id);
      setEbdModality(match.modality);
    }
  }, [
    loadingTreatment,
    catalogs.loading,
    catalogs.ebdIndications,
    typeFlags.useEbdServiceFlow,
    treatmentType,
    serviceType,
    ebdIndicationId,
  ]);

  useEffect(() => {
    if (!supabaseEnabled || committedPaths.length === 0) {
      setSignedByPath({});
      return;
    }
    let cancelled = false;
    void fetchTreatmentPhotoSignedUrls(committedPaths).then((urls) => {
      if (cancelled) {
        return;
      }
      const map: Record<string, string> = {};
      committedPaths.forEach((path, i) => {
        if (urls[i]) {
          map[path] = urls[i];
        }
      });
      setSignedByPath(map);
    });
    return () => {
      cancelled = true;
    };
  }, [committedPaths, supabaseEnabled]);

  const photoEntries = useMemo(
    () => [
      ...committedPaths.map((path) => ({ uri: signedByPath[path] })),
      ...localPicks.map((p) => ({ uri: p.uri })),
    ],
    [committedPaths, signedByPath, localPicks],
  );

  const viewerUris = useMemo(
    () => photoEntries.map((e) => e.uri).filter((u): u is string => Boolean(u)),
    [photoEntries],
  );

  const openPhotoViewerAtStripIndex = useCallback(
    (stripIndex: number) => {
      const row = photoEntries[stripIndex];
      if (!row?.uri) {
        return;
      }
      let v = 0;
      for (let k = 0; k < stripIndex; k++) {
        if (photoEntries[k]?.uri) {
          v++;
        }
      }
      setPhotoViewerIndex(v);
      setPhotoViewerOpen(true);
    },
    [photoEntries],
  );

  const onSave = async () => {
    setError(null);
    if (!supabaseEnabled || !id) {
      setError("Cannot save.");
      return;
    }
    let st = serviceType.trim();
    let ebdId: string | null = null;
    let ebdMod: EbdModality | null = null;
    if (useEbdLaser) {
      if (!ebdIndicationId.trim()) {
        setError(`${appStrings.ebdTreatmentCategoryLabel} is required.`);
        return;
      }
      ebdId = ebdIndicationId.trim();
      ebdMod = ebdModality;
      const row = catalogs.ebdIndications?.find((x) => x.id === ebdId);
      st = row?.name.trim() ?? "";
      if (!st) {
        setError("Could not resolve EBD category.");
        return;
      }
    } else if (!st) {
      setError("Service type is required.");
      return;
    }
    const d = parseDateInput(dateStr);
    const selectedProviderId = providerId.trim();
    if (!selectedProviderId) {
      setError("Provider is required.");
      return;
    }
    if (!d) {
      setError("Use treatment date as YYYY-MM-DD.");
      return;
    }
    let units = 0;
    if (typeFlags.showUnitsField) {
      const u = Number.parseInt(unitsText.trim(), 10);
      if (!Number.isFinite(u) || u < 0) {
        setError("Units must be a non-negative whole number.");
        return;
      }
      units = u;
    }
    const areas = [...selectedAreas];
    const brandValue = buildTreatmentBrandValue(
      useLaserPicker,
      brandRowId,
      brandOtherDetail,
      injectableBrandOptions,
      catalogs.laserTypes,
    );
    let cost: number | null = null;
    const ct = costText.trim();
    if (ct !== "") {
      const n = Number.parseFloat(ct);
      if (!Number.isFinite(n) || n < 0) {
        setError("Cost must be a valid non-negative number or empty.");
        return;
      }
      cost = n;
    }

    const removed = initialPathsRef.current.filter((p) => !committedPaths.includes(p));
    const photoChanges =
      localPicks.length || removed.length
        ? {
            ...(localPicks.length ? { addLocal: localPicks } : {}),
            ...(removed.length ? { removeStoragePaths: removed } : {}),
          }
        : undefined;

    setSaving(true);
    try {
      await updateTreatmentForCurrentUser(
        id,
        {
          treatmentType,
          serviceType: st,
          brand: brandValue.trim(),
          ebdIndicationId: ebdId,
          ebdModality: ebdMod,
          treatmentAreas: areas,
          units,
          providerId: selectedProviderId,
          treatmentDate: d,
          notes: notes.trim(),
          cost,
          photoUrls: committedPaths,
        },
        photoChanges,
      );
      router.back();
    } catch (e) {
      if (isWriteQueuedError(e)) {
        Alert.alert("Saved offline", e.message, [{ text: "OK", onPress: () => router.back() }]);
        return;
      }
      setError(e instanceof Error ? e.message : "Could not save treatment.");
    } finally {
      setSaving(false);
    }
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase to edit treatments.</Text>
      </View>
    );
  }

  if (loadingTreatment) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  if (loadErr) {
    return (
      <View style={styles.padded}>
        <Text style={styles.err}>{loadErr}</Text>
      </View>
    );
  }

  return (
    <>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <CatalogLoadState loading={catalogs.loading} error={catalogs.error} />
        <Text style={styles.label}>Type</Text>
        <TreatmentTypeSelectGrid
          types={catalogs.treatmentTypes ?? []}
          selectedSlug={treatmentType}
          onSelectType={(nextSlug) => {
            if (treatmentType !== nextSlug) {
              const nextFlags = treatmentTypeFlagsForSlug(nextSlug, catalogs.treatmentTypes ?? []);
              const hasEbd = (catalogs.ebdIndications?.length ?? 0) > 0;
              setEbdIndicationId("");
              setEbdModality("laser");
              if (nextFlags.useEbdServiceFlow && hasEbd) {
                setServiceType("");
              }
            }
            setTreatmentType(nextSlug);
          }}
        />

        {useEbdLaser ? (
          <>
            <Text style={styles.label}>{appStrings.ebdModalityLabel}</Text>
            <View style={styles.row}>
              {(["laser", "photofacial"] as const).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, ebdModality === m && styles.chipOn]}
                  onPress={() => setEbdModality(m)}
                >
                  <Text style={[styles.ebdChipText, ebdModality === m && styles.chipTextOn]}>
                    {m === "laser"
                      ? appStrings.ebdModalityLaser
                      : appStrings.ebdModalityPhotofacial}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>{appStrings.ebdTreatmentCategoryLabel} *</Text>
            {filteredEbdIndications.length === 0 ? (
              <Text style={styles.catalogWarn}>{appStrings.treatmentServiceTypeEmptyList}</Text>
            ) : null}
            <CatalogItemSelect
              sheetTitle={appStrings.ebdTreatmentCategorySheetTitle}
              valueKey="id"
              value={ebdIndicationId}
              options={filteredEbdIndications}
              placeholder={appStrings.ebdTreatmentCategoryPlaceholder}
              onChange={(id) => {
                setEbdIndicationId(id);
                const row = catalogs.ebdIndications?.find((x) => x.id === id);
                setServiceType(row?.name ?? "");
              }}
              disabled={filteredEbdIndications.length === 0}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Service type *</Text>
            {filteredServiceTypes.length === 0 ? (
              <Text style={styles.catalogWarn}>{appStrings.treatmentServiceTypeEmptyList}</Text>
            ) : null}
            <CatalogItemSelect
              sheetTitle={appStrings.treatmentServiceTypeSheetTitle}
              value={serviceType}
              options={filteredServiceTypes}
              placeholder={appStrings.treatmentServiceTypePlaceholder}
              onChange={setServiceType}
              disabled={filteredServiceTypes.length === 0}
            />
          </>
        )}

        <TreatmentBrandFields
          useLaserDeviceBrandPicker={useLaserPicker}
          serviceTypeName={serviceType}
          serviceTypes={catalogs.serviceTypes}
          serviceTypeBrands={catalogs.serviceTypeBrands}
          laserTypes={ebdLaserPickerTypes}
          brandRowId={brandRowId}
          onBrandRowId={setBrandRowId}
          brandOtherDetail={brandOtherDetail}
          onBrandOtherDetail={setBrandOtherDetail}
        />

        <Text style={styles.label}>Treatment areas</Text>
        <Text style={styles.areasSummary}>
          {selectedAreas.length === 0
            ? appStrings.treatmentAreasSummaryNone
            : `${appStrings.treatmentAreasSummaryPrefix} ${selectedAreas.join(", ")}`}
        </Text>
        {legacySelectedAreas.length > 0 ? (
          <View style={styles.legacyBox}>
            <Text style={styles.legacyNote}>{appStrings.treatmentAreasLegacyNote}</Text>
            {legacySelectedAreas.map((a) => (
              <Pressable
                key={a}
                style={styles.legacyRow}
                onPress={() =>
                  setSelectedAreas((cur) =>
                    cur.filter((x) => x.trim().toLowerCase() !== a.trim().toLowerCase()),
                  )
                }
              >
                <Text style={styles.legacyText}>{a}</Text>
                <Text style={styles.legacyRemove}>×</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <TreatmentAreaCatalogChips
          items={catalogs.treatmentAreas}
          selected={selectedAreas}
          onChangeSelected={setSelectedAreas}
        />

        {typeFlags.showUnitsField ? (
          <>
            <Text style={styles.label}>Units</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={unitsText}
              onChangeText={setUnitsText}
            />
          </>
        ) : null}

        <Text style={styles.label}>Treatment date (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} autoCapitalize="none" value={dateStr} onChangeText={setDateStr} />

        <Text style={styles.label}>Provider *</Text>
        {loadingProviders ? (
          <ActivityIndicator color={colors.primaryNavy} style={styles.loader} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerStrip}>
            {providers.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.chip, providerId === p.id && styles.chipOn]}
                onPress={() => setProviderId(p.id)}
              >
                <Text
                  style={[styles.chipText, providerId === p.id && styles.chipTextOn]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Cost</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Optional"
          placeholderTextColor={colors.textLight}
          value={costText}
          onChangeText={setCostText}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Optional"
          placeholderTextColor={colors.textLight}
          value={notes}
          onChangeText={setNotes}
        />

        <Text style={styles.label}>
          Photos ({committedPaths.length + localPicks.length}/{MAX_TREATMENT_PHOTOS})
        </Text>
        <Text style={styles.photoHint}>Requires internet to add or remove. Signed URLs refresh while you edit.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
          {committedPaths.map((path, stripIndex) => (
            <View key={path} style={styles.thumbWrap}>
              {signedByPath[path] ? (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel={appStrings.treatmentPhotoThumbnailA11y}
                  onPress={() => openPhotoViewerAtStripIndex(stripIndex)}
                >
                  <Image source={{ uri: signedByPath[path] }} style={styles.thumb} />
                </Pressable>
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <Text style={styles.thumbDate} numberOfLines={1}>
                {formatDisplayDate(
                  photoDateByPath[path] ?? treatmentDatePreview ?? new Date(),
                )}
              </Text>
              <Pressable
                style={styles.thumbRemove}
                onPress={() => setCommittedPaths((cur) => cur.filter((p) => p !== path))}
              >
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
          {localPicks.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={styles.thumbWrap}>
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={appStrings.treatmentPhotoThumbnailA11y}
                onPress={() => openPhotoViewerAtStripIndex(committedPaths.length + i)}
              >
                <Image source={{ uri: p.uri }} style={styles.thumb} />
              </Pressable>
              <Text style={styles.thumbDate} numberOfLines={1}>
                {formatDisplayDate(p.capturedAt ?? treatmentDatePreview ?? new Date())}
              </Text>
              <Pressable
                style={styles.thumbRemove}
                onPress={() => setLocalPicks((cur) => cur.filter((_, j) => j !== i))}
              >
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View style={styles.photoActions}>
          <Pressable
            style={styles.addPhotos}
            onPress={() =>
              void pickTreatmentImages(committedPaths.length + localPicks.length, "library").then(
                (next) => {
                  if (next.length) {
                    setLocalPicks((cur) => [...cur, ...next]);
                  }
                },
              )
            }
          >
            <Text style={styles.addPhotosText}>Add from library</Text>
          </Pressable>
          <Pressable
            style={styles.addPhotos}
            onPress={() =>
              void pickTreatmentImages(committedPaths.length + localPicks.length, "camera").then(
                (next) => {
                  if (next.length) {
                    setLocalPicks((cur) => [...cur, ...next]);
                  }
                },
              )
            }
          >
            <Text style={styles.addPhotosText}>Take photo</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable
          style={[styles.save, saving && styles.saveDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryNavy} />
          ) : (
            <Text style={styles.saveText}>Save changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

    <TreatmentPhotoViewer
      visible={photoViewerOpen}
      uris={viewerUris}
      imageIndex={photoViewerIndex}
      onImageIndexChange={setPhotoViewerIndex}
      onRequestClose={() => setPhotoViewerOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  scroll: { padding: 16, paddingBottom: 40 },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  catalogWarn: {
    fontSize: 13,
    color: colors.warningOrange,
    marginBottom: 8,
    lineHeight: 18,
    fontWeight: "600",
  },
  areasSummary: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  legacyBox: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  legacyNote: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, lineHeight: 17 },
  legacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: colors.cleanWhite,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  legacyText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  legacyRemove: { fontSize: 22, color: colors.errorRed, paddingHorizontal: 8 },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  notes: { minHeight: 88, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { color: colors.textPrimary, fontWeight: "500", textTransform: "capitalize" },
  ebdChipText: { color: colors.textPrimary, fontWeight: "500" },
  chipTextOn: { color: colors.primaryNavy },
  providerStrip: { flexGrow: 0, marginVertical: 4 },
  loader: { marginVertical: 8 },
  err: { color: colors.errorRed, marginTop: 12 },
  save: {
    marginTop: 24,
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
  photoHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  photoStrip: { flexGrow: 0, marginBottom: 8 },
  thumbWrap: { marginRight: 10, position: "relative" },
  thumb: { width: 88, height: 88, borderRadius: 8, backgroundColor: colors.borderSubtle },
  thumbPlaceholder: { borderWidth: 1, borderColor: colors.borderMuted },
  thumbDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: 88,
  },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.overlayStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemoveText: { color: colors.cleanWhite, fontSize: 18, fontWeight: "700", lineHeight: 20 },
  addPhotos: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryNavy,
  },
  addPhotosText: { color: colors.primaryNavy, fontWeight: "600" },
  photoActions: { flexDirection: "row", gap: 10 },
});
