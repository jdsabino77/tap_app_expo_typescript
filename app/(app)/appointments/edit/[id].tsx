import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { TreatmentBrandFields } from "../../../../src/components/treatment-brand-fields";
import { CatalogLoadState } from "../../../../src/components/catalog-suggestions";
import type { AppointmentKind } from "../../../../src/domain/appointment";
import type { Provider } from "../../../../src/domain/provider";
import { filterServiceTypesForTreatment } from "../../../../src/domain/reference-content";
import type { TreatmentType } from "../../../../src/domain/treatment";
import { useReferenceCatalogs } from "../../../../src/hooks/useReferenceCatalogs";
import { combineLocalYmdAndHm } from "../../../../src/lib/datetime";
import {
  brandsForServiceTypeName,
  buildTreatmentBrandValue,
  resolveBrandPickFromSaved,
} from "../../../../src/lib/treatment-brand-form";
import {
  fetchAppointmentByIdForCurrentUser,
  updateAppointmentForCurrentUser,
} from "../../../../src/repositories/appointment.repository";
import {
  fetchProviderByIdForCurrentUser,
  fetchProvidersForCurrentUser,
} from "../../../../src/repositories/provider.repository";
import { appStrings } from "../../../../src/strings/appStrings";
import { useSession } from "../../../../src/store/session";
import { colors } from "../../../../src/theme/tokens";

export default function EditAppointmentScreen() {
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
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  /** null until initial row loaded — avoids kind-change effects wiping hydrated fields */
  const [appointmentKind, setAppointmentKind] = useState<AppointmentKind | null>(null);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>("injectable");
  const [serviceType, setServiceType] = useState("");
  const [brandRowId, setBrandRowId] = useState("");
  const [brandOtherDetail, setBrandOtherDetail] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("09:00");
  const [durationText, setDurationText] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treatmentBrandSnapshotRef = useRef<{
    savedBrand: string;
    treatmentType: TreatmentType;
    serviceType: string;
  } | null>(null);
  const lastBrandHydrateKeyRef = useRef("");

  const filteredServiceTypes = useMemo(
    () => filterServiceTypesForTreatment(catalogs.serviceTypes, treatmentType),
    [catalogs.serviceTypes, treatmentType],
  );

  useEffect(() => {
    if (appointmentKind !== "treatment" || filteredServiceTypes.length === 0) {
      return;
    }
    setServiceType((prev) => {
      const ok = filteredServiceTypes.some(
        (s) => s.name.trim().toLowerCase() === prev.trim().toLowerCase(),
      );
      return ok ? prev : "";
    });
  }, [appointmentKind, treatmentType, filteredServiceTypes]);

  const prevKindRef = useRef<AppointmentKind | null>(null);
  useEffect(() => {
    if (appointmentKind === null) {
      return;
    }
    if (prevKindRef.current === null) {
      prevKindRef.current = appointmentKind;
      return;
    }
    if (prevKindRef.current !== appointmentKind) {
      setBrandRowId("");
      setBrandOtherDetail("");
      setServiceType("");
      treatmentBrandSnapshotRef.current = null;
    }
    prevKindRef.current = appointmentKind;
  }, [appointmentKind]);

  const prevModalityRef = useRef<TreatmentType | null>(null);
  const prevServiceRef = useRef<string | null>(null);
  useEffect(() => {
    if (appointmentKind !== "treatment") {
      return;
    }
    if (prevModalityRef.current === null) {
      prevModalityRef.current = treatmentType;
      prevServiceRef.current = serviceType;
      return;
    }
    if (prevModalityRef.current !== treatmentType) {
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
  }, [appointmentKind, treatmentType, serviceType]);

  const injectableBrandOptions = useMemo(
    () =>
      appointmentKind === "treatment"
        ? brandsForServiceTypeName(serviceType, catalogs.serviceTypes, catalogs.serviceTypeBrands)
        : [],
    [appointmentKind, serviceType, catalogs.serviceTypes, catalogs.serviceTypeBrands],
  );

  useEffect(() => {
    lastBrandHydrateKeyRef.current = "";
  }, [id]);

  useEffect(() => {
    if (loadingAppointment || appointmentKind !== "treatment" || catalogs.loading) {
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
    const brandIdsKey =
      treatmentType === "laser"
        ? catalogs.laserTypes.map((l) => l.id).join(",")
        : inj.map((b) => b.id).join(",");
    const hydrateKey = `${id}:${brandIdsKey}:${snap.savedBrand}`;
    if (lastBrandHydrateKeyRef.current === hydrateKey) {
      return;
    }
    const { rowId, otherDetail } = resolveBrandPickFromSaved(
      snap.savedBrand,
      inj,
      catalogs.laserTypes,
      treatmentType,
    );
    setBrandRowId(rowId);
    setBrandOtherDetail(otherDetail);
    lastBrandHydrateKeyRef.current = hydrateKey;
  }, [
    id,
    loadingAppointment,
    appointmentKind,
    catalogs.loading,
    catalogs.laserTypes,
    serviceType,
    treatmentType,
    injectableBrandOptions,
  ]);

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
      setLoadingAppointment(false);
      return;
    }
    let cancelled = false;
    setLoadingAppointment(true);
    setLoadErr(null);
    void fetchAppointmentByIdForCurrentUser(id)
      .then(async (a) => {
        if (cancelled) {
          return;
        }
        if (!a) {
          setLoadErr("Appointment not found.");
          setLoadingAppointment(false);
          return;
        }
        if (a.status !== "scheduled") {
          setLoadErr("Only scheduled appointments can be edited.");
          setLoadingAppointment(false);
          return;
        }
        prevKindRef.current = null;
        prevModalityRef.current = null;
        prevServiceRef.current = null;
        setAppointmentKind(a.appointmentKind);
        const tt = a.treatmentType ?? "injectable";
        setTreatmentType(tt);
        setServiceType(a.serviceType);
        if (a.appointmentKind === "treatment") {
          treatmentBrandSnapshotRef.current = {
            savedBrand: a.brand,
            treatmentType: tt,
            serviceType: a.serviceType,
          };
          setBrandRowId("");
          setBrandOtherDetail("");
        } else {
          treatmentBrandSnapshotRef.current = null;
          setBrandRowId("");
          setBrandOtherDetail("");
        }
        setDateStr(format(a.scheduledAt, "yyyy-MM-dd"));
        setTimeStr(format(a.scheduledAt, "HH:mm"));
        setDurationText(a.durationMinutes != null ? String(a.durationMinutes) : "");
        setProviderId(a.providerId);
        setNotes(a.notes);
        await loadProviders(a.providerId);
        setLoadingAppointment(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "Failed to load");
          setLoadingAppointment(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, id, loadProviders]);

  const onSave = async () => {
    setError(null);
    if (!supabaseEnabled || !id || appointmentKind === null) {
      setError("Connect Supabase to save appointments.");
      return;
    }

    const scheduledAt = combineLocalYmdAndHm(dateStr, timeStr);
    if (!scheduledAt) {
      setError("Use date YYYY-MM-DD and time HH:mm (e.g. 09:30).");
      return;
    }
    if (scheduledAt.getTime() <= Date.now()) {
      setError(appStrings.appointmentScheduledHint);
      return;
    }

    let durationMinutes: number | null = null;
    const d = durationText.trim();
    if (d !== "") {
      const n = Number.parseInt(d, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Duration must be a positive number of minutes or empty.");
        return;
      }
      durationMinutes = n;
    }

    let st = "";
    let tt: TreatmentType | null = null;
    let brandValue = "";

    if (appointmentKind === "consult") {
      st = serviceType.trim() || "Consultation";
      tt = null;
    } else {
      st = serviceType.trim();
      if (!st) {
        setError("Service type is required for a treatment visit.");
        return;
      }
      tt = treatmentType;
      brandValue = buildTreatmentBrandValue(
        treatmentType,
        brandRowId,
        brandOtherDetail,
        injectableBrandOptions,
        catalogs.laserTypes,
      ).trim();
    }

    setSaving(true);
    try {
      await updateAppointmentForCurrentUser(id, {
        appointmentKind,
        treatmentType: tt,
        serviceType: st,
        brand: brandValue,
        scheduledAt,
        durationMinutes,
        providerId,
        notes,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save appointment.");
    } finally {
      setSaving(false);
    }
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase to edit appointments.</Text>
      </View>
    );
  }

  if (loadingAppointment) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  if (loadErr || appointmentKind === null) {
    return (
      <View style={styles.padded}>
        <Text style={styles.err}>{loadErr ?? "Unable to load appointment."}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <CatalogLoadState loading={catalogs.loading} error={catalogs.error} />

        <Text style={styles.label}>{appStrings.appointmentKindLabel}</Text>
        <View style={styles.row}>
          {(["consult", "treatment"] as const).map((k) => (
            <Pressable
              key={k}
              style={[styles.chip, appointmentKind === k && styles.chipOn]}
              onPress={() => setAppointmentKind(k)}
            >
              <Text style={[styles.chipTextRaw, appointmentKind === k && styles.chipTextOn]}>
                {k === "consult" ? appStrings.appointmentKindConsult : appStrings.appointmentKindTreatment}
              </Text>
            </Pressable>
          ))}
        </View>

        {appointmentKind === "treatment" ? (
          <>
            <Text style={styles.label}>Type</Text>
            <View style={styles.row}>
              {(["injectable", "laser"] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, treatmentType === t && styles.chipOn]}
                  onPress={() => setTreatmentType(t)}
                >
                  <Text style={[styles.chipText, treatmentType === t && styles.chipTextOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>

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

            <TreatmentBrandFields
              treatmentType={treatmentType}
              serviceTypeName={serviceType}
              serviceTypes={catalogs.serviceTypes}
              serviceTypeBrands={catalogs.serviceTypeBrands}
              laserTypes={catalogs.laserTypes}
              brandRowId={brandRowId}
              onBrandRowId={setBrandRowId}
              brandOtherDetail={brandOtherDetail}
              onBrandOtherDetail={setBrandOtherDetail}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Reason / visit focus (optional)</Text>
            <Text style={styles.fieldHint}>Defaults to &quot;Consultation&quot; if left empty.</Text>
            <TextInput
              style={styles.input}
              placeholder="Consultation"
              placeholderTextColor={colors.textLight}
              value={serviceType}
              onChangeText={setServiceType}
            />
          </>
        )}

        <Text style={styles.label}>{appStrings.appointmentDateLabel} *</Text>
        <TextInput style={styles.input} autoCapitalize="none" value={dateStr} onChangeText={setDateStr} />

        <Text style={styles.label}>{appStrings.appointmentTimeLabel} *</Text>
        <TextInput style={styles.input} autoCapitalize="none" value={timeStr} onChangeText={setTimeStr} />

        <Text style={styles.label}>{appStrings.appointmentDurationHint}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Optional"
          placeholderTextColor={colors.textLight}
          value={durationText}
          onChangeText={setDurationText}
        />

        <Text style={styles.label}>Provider</Text>
        {loadingProviders ? (
          <ActivityIndicator color={colors.primaryNavy} style={styles.loader} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerStrip}>
            <Pressable
              style={[styles.chip, providerId === null && styles.chipOn]}
              onPress={() => setProviderId(null)}
            >
              <Text style={[styles.chipText, providerId === null && styles.chipTextOn]}>None</Text>
            </Pressable>
            {providers.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.chip, providerId === p.id && styles.chipOn]}
                onPress={() => setProviderId(p.id)}
              >
                <Text style={[styles.chipText, providerId === p.id && styles.chipTextOn]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Optional"
          placeholderTextColor={colors.textLight}
          value={notes}
          onChangeText={setNotes}
        />

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable
          style={[styles.save, saving && styles.saveDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryNavy} />
          ) : (
            <Text style={styles.saveText}>{appStrings.saveAppointmentChanges}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  scroll: { padding: 16, paddingBottom: 40 },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  fieldHint: { fontSize: 12, color: colors.textLight, marginBottom: 8 },
  catalogWarn: {
    fontSize: 13,
    color: colors.warningOrange,
    marginBottom: 8,
    lineHeight: 18,
    fontWeight: "600",
  },
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
  notes: { minHeight: 72, textAlignVertical: "top" },
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
  chipTextRaw: { color: colors.textPrimary, fontWeight: "500" },
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
});
