import { useFocusEffect } from "@react-navigation/native";
import { addDays, format } from "date-fns";
import { router } from "expo-router";
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
import { CatalogItemSelect } from "../../../src/components/catalog-item-select";
import { TreatmentBrandFields } from "../../../src/components/treatment-brand-fields";
import { CatalogLoadState } from "../../../src/components/catalog-suggestions";
import type { AppointmentKind } from "../../../src/domain/appointment";
import type { Provider } from "../../../src/domain/provider";
import type { EbdModality } from "../../../src/domain/ebd-modality";
import {
  ebdIndicationsForModality,
  filterServiceTypesForTreatment,
} from "../../../src/domain/reference-content";
import type { TreatmentType } from "../../../src/domain/treatment";
import { useReferenceCatalogs } from "../../../src/hooks/useReferenceCatalogs";
import { combineLocalYmdAndHm } from "../../../src/lib/datetime";
import { laserTypesForEbdIndication } from "../../../src/lib/treatment-ebd-laser-types";
import { brandsForServiceTypeName, buildTreatmentBrandValue } from "../../../src/lib/treatment-brand-form";
import { createAppointmentForCurrentUser } from "../../../src/repositories/appointment.repository";
import { fetchProvidersForCurrentUser } from "../../../src/repositories/provider.repository";
import { appStrings } from "../../../src/strings/appStrings";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function NewAppointmentScreen() {
  const { supabaseEnabled } = useSession();
  const catalogs = useReferenceCatalogs();
  useFocusEffect(
    useCallback(() => {
      void catalogs.refresh();
    }, [catalogs.refresh]),
  );

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [appointmentKind, setAppointmentKind] = useState<AppointmentKind>("consult");
  const [treatmentType, setTreatmentType] = useState<TreatmentType>("injectable");
  const [serviceType, setServiceType] = useState("");
  const [ebdModality, setEbdModality] = useState<EbdModality>("laser");
  const [ebdIndicationId, setEbdIndicationId] = useState("");
  const [brandRowId, setBrandRowId] = useState("");
  const [brandOtherDetail, setBrandOtherDetail] = useState("");
  const [dateStr, setDateStr] = useState(() => format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [timeStr, setTimeStr] = useState("09:00");
  const [durationText, setDurationText] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useEbdLaser =
    appointmentKind === "treatment" &&
    treatmentType === "laser" &&
    (catalogs.ebdIndications?.length ?? 0) > 0;

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
    if (appointmentKind !== "treatment" || useEbdLaser) {
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
  }, [appointmentKind, treatmentType, filteredServiceTypes, useEbdLaser]);

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

  const prevKindRef = useRef<AppointmentKind | null>(null);
  useEffect(() => {
    if (prevKindRef.current !== null && prevKindRef.current !== appointmentKind) {
      setBrandRowId("");
      setBrandOtherDetail("");
      setServiceType("");
      setEbdIndicationId("");
      setEbdModality("laser");
    }
    prevKindRef.current = appointmentKind;
  }, [appointmentKind]);

  const prevModalityRef = useRef<TreatmentType | null>(null);
  const prevServiceRef = useRef<string | null>(null);
  useEffect(() => {
    if (appointmentKind !== "treatment") {
      return;
    }
    if (prevModalityRef.current !== null && prevModalityRef.current !== treatmentType) {
      setBrandRowId("");
      setBrandOtherDetail("");
    }
    if (prevServiceRef.current !== null && prevServiceRef.current !== serviceType) {
      setBrandRowId("");
      setBrandOtherDetail("");
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

  const loadProviders = useCallback(async () => {
    if (!supabaseEnabled) {
      return;
    }
    setLoadingProviders(true);
    try {
      const list = await fetchProvidersForCurrentUser();
      setProviders(list);
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  }, [supabaseEnabled]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const onSave = async () => {
    setError(null);
    if (!supabaseEnabled) {
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
    let ebdIndicationIdForSave: string | null = null;

    if (appointmentKind === "consult") {
      st = serviceType.trim() || "Consultation";
      tt = null;
    } else {
      if (treatmentType === "laser" && useEbdLaser) {
        if (!ebdIndicationId.trim()) {
          setError(`${appStrings.ebdTreatmentCategoryLabel} is required for a treatment visit.`);
          return;
        }
        ebdIndicationIdForSave = ebdIndicationId.trim();
        const row = catalogs.ebdIndications?.find((x) => x.id === ebdIndicationIdForSave);
        st = row?.name.trim() ?? "";
        if (!st) {
          setError("Could not resolve EBD category.");
          return;
        }
      } else {
        st = serviceType.trim();
        if (!st) {
          setError("Service type is required for a treatment visit.");
          return;
        }
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
      await createAppointmentForCurrentUser({
        appointmentKind,
        treatmentType: tt,
        serviceType: st,
        brand: brandValue,
        ebdIndicationId: ebdIndicationIdForSave,
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
        <Text style={styles.muted}>Configure Supabase to add appointments.</Text>
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
                  onPress={() => {
                    if (treatmentType !== t) {
                      if (t === "injectable") {
                        setEbdIndicationId("");
                        setEbdModality("laser");
                      } else if (t === "laser" && (catalogs.ebdIndications?.length ?? 0) > 0) {
                        setEbdIndicationId("");
                        setEbdModality("laser");
                        setServiceType("");
                      }
                    }
                    setTreatmentType(t);
                  }}
                >
                  <Text style={[styles.ebdChipText, treatmentType === t && styles.chipTextOn]}>
                    {t === "laser"
                      ? appStrings.treatmentTypeEnergyBasedDevicesLabel
                      : appStrings.treatmentTypeInjectableLabel}
                  </Text>
                </Pressable>
              ))}
            </View>

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
              treatmentType={treatmentType}
              serviceTypeName={serviceType}
              serviceTypes={catalogs.serviceTypes}
              serviceTypeBrands={catalogs.serviceTypeBrands}
              laserTypes={ebdLaserPickerTypes}
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
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={dateStr}
          onChangeText={setDateStr}
        />

        <Text style={styles.label}>{appStrings.appointmentTimeLabel} *</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={timeStr}
          onChangeText={setTimeStr}
        />

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
            <Text style={styles.saveText}>{appStrings.addAppointmentCta}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
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
  ebdChipText: { color: colors.textPrimary, fontWeight: "500" },
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
