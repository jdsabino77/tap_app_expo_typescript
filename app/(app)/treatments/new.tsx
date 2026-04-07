import { router } from "expo-router";
import { format, isValid, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  CatalogLoadState,
  LaserBrandCatalogChips,
  ServiceTypeCatalogChips,
  TreatmentAreaCatalogChips,
} from "../../../src/components/catalog-suggestions";
import { filterServiceTypesForTreatment } from "../../../src/domain/reference-content";
import type { TreatmentType } from "../../../src/domain/treatment";
import { useReferenceCatalogs } from "../../../src/hooks/useReferenceCatalogs";
import { fetchProvidersForCurrentUser } from "../../../src/repositories/provider.repository";
import { createTreatmentForCurrentUser } from "../../../src/repositories/treatment.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";
import type { Provider } from "../../../src/domain/provider";

function parseDateInput(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const d = parseISO(t);
  return isValid(d) ? d : null;
}

export default function NewTreatmentScreen() {
  const { supabaseEnabled } = useSession();
  const catalogs = useReferenceCatalogs();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [treatmentType, setTreatmentType] = useState<TreatmentType>("injectable");
  const [serviceType, setServiceType] = useState("");
  const [brand, setBrand] = useState("");
  const [areasText, setAreasText] = useState("");
  const [unitsText, setUnitsText] = useState("0");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [costText, setCostText] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredServiceTypes = useMemo(
    () => filterServiceTypesForTreatment(catalogs.serviceTypes, treatmentType),
    [catalogs.serviceTypes, treatmentType],
  );

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
      setError("Connect Supabase to save treatments.");
      return;
    }
    const st = serviceType.trim();
    if (!st) {
      setError("Service type is required.");
      return;
    }
    const d = parseDateInput(dateStr);
    if (!d) {
      setError("Use treatment date as YYYY-MM-DD.");
      return;
    }
    const units = Number.parseInt(unitsText.trim(), 10);
    if (!Number.isFinite(units) || units < 0) {
      setError("Units must be a non-negative whole number.");
      return;
    }
    const areas = areasText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
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

    setSaving(true);
    try {
      await createTreatmentForCurrentUser({
        treatmentType,
        serviceType: st,
        brand: brand.trim(),
        treatmentAreas: areas,
        units,
        providerId,
        treatmentDate: d,
        notes: notes.trim(),
        cost,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save treatment.");
    } finally {
      setSaving(false);
    }
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase in app config to create treatments.</Text>
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
        <TextInput
          style={styles.input}
          placeholder="e.g. Botox, IPL"
          placeholderTextColor={colors.textLight}
          value={serviceType}
          onChangeText={setServiceType}
        />
        <ServiceTypeCatalogChips
          items={filteredServiceTypes}
          current={serviceType}
          onSelect={setServiceType}
        />

        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          placeholderTextColor={colors.textLight}
          value={brand}
          onChangeText={setBrand}
        />
        {treatmentType === "laser" ? (
          <LaserBrandCatalogChips items={catalogs.laserTypes} current={brand} onSelect={setBrand} />
        ) : null}

        <Text style={styles.label}>Treatment areas</Text>
        <TextInput
          style={styles.input}
          placeholder="Comma-separated (e.g. Forehead, Crow's feet)"
          placeholderTextColor={colors.textLight}
          value={areasText}
          onChangeText={setAreasText}
        />
        <TreatmentAreaCatalogChips
          items={catalogs.treatmentAreas}
          value={areasText}
          onChange={setAreasText}
        />

        <Text style={styles.label}>Units</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={unitsText}
          onChangeText={setUnitsText}
        />

        <Text style={styles.label}>Treatment date (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={dateStr}
          onChangeText={setDateStr}
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

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable
          style={[styles.save, saving && styles.saveDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryNavy} />
          ) : (
            <Text style={styles.saveText}>Save treatment</Text>
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
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
    borderColor: "#E9ECEF",
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { color: colors.textPrimary, fontWeight: "500", textTransform: "capitalize" },
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
