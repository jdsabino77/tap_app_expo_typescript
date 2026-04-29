import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  ProviderSpecialtyCatalogChips,
} from "../../../src/components/catalog-suggestions";
import { useReferenceCatalogs } from "../../../src/hooks/useReferenceCatalogs";
import { isWriteQueuedError } from "../../../src/lib/write-queued-error";
import { createProviderForCurrentUser } from "../../../src/repositories/provider.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function AddProviderScreen() {
  const params = useLocalSearchParams<{
    returnTo?: string | string[];
    fromAppointment?: string | string[];
    draft?: string | string[];
  }>();
  const returnTo = firstParam(params.returnTo);
  const fromAppointment = firstParam(params.fromAppointment);
  const draft = firstParam(params.draft);
  const { supabaseEnabled } = useSession();
  const catalogs = useReferenceCatalogs();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [specialtiesText, setSpecialtiesText] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!supabaseEnabled) {
      setError("Connect Supabase to add providers.");
      return;
    }
    const n = name.trim();
    if (!n) {
      setError("Provider name is required.");
      return;
    }

    const specialties = specialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const created = await createProviderForCurrentUser({
        name: n,
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        specialties,
      });
      if (returnTo) {
        router.replace({
          pathname: returnTo as "/(app)/treatments/new",
          params: {
            selectedProviderId: created.id,
            fromAppointment,
            draft,
          },
        });
        return;
      }
      router.back();
    } catch (e) {
      if (isWriteQueuedError(e)) {
        Alert.alert("Saved offline", e.message, [{ text: "OK", onPress: () => router.back() }]);
        return;
      }
      setError(e instanceof Error ? e.message : "Could not save provider.");
    } finally {
      setSaving(false);
    }
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase in app config to add your own providers.</Text>
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
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Clinic or practitioner"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Street address</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textLight} value={city} onChangeText={setCity} />

        <Text style={styles.label}>Province / state</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          value={province}
          onChangeText={setProvince}
        />

        <Text style={styles.label}>Postal code</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="characters"
          placeholderTextColor={colors.textLight}
          value={postalCode}
          onChangeText={setPostalCode}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor={colors.textLight}
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholderTextColor={colors.textLight}
          value={website}
          onChangeText={setWebsite}
        />

        <Text style={styles.label}>Specialties / services</Text>
        <TextInput
          style={styles.input}
          placeholder="Comma-separated (e.g. Laser, Injectable)"
          placeholderTextColor={colors.textLight}
          value={specialtiesText}
          onChangeText={setSpecialtiesText}
        />
        <ProviderSpecialtyCatalogChips
          items={catalogs.providerServices}
          value={specialtiesText}
          onChange={setSpecialtiesText}
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
            <Text style={styles.saveText}>Save provider</Text>
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
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
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

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v)) {
    return v[0];
  }
  return undefined;
}
