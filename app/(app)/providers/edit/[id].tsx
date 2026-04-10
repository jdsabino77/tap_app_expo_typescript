import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
} from "../../../../src/components/catalog-suggestions";
import { useReferenceCatalogs } from "../../../../src/hooks/useReferenceCatalogs";
import { isWriteQueuedError } from "../../../../src/lib/write-queued-error";
import {
  fetchProviderByIdForCurrentUser,
  updateProviderForCurrentUser,
} from "../../../../src/repositories/provider.repository";
import { useSession } from "../../../../src/store/session";
import { colors } from "../../../../src/theme/tokens";

export default function EditProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const catalogs = useReferenceCatalogs();
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

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

  useEffect(() => {
    if (!supabaseEnabled || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadErr(null);
    void fetchProviderByIdForCurrentUser(id)
      .then((res) => {
        if (cancelled || !res) {
          if (!cancelled) {
            setLoadErr("Provider not found.");
          }
          return;
        }
        if (!res.canMutate) {
          if (!cancelled) {
            setLoadErr("You cannot edit this provider.");
          }
          return;
        }
        const p = res.provider;
        setName(p.name);
        setAddress(p.address);
        setCity(p.city);
        setProvince(p.province);
        setPostalCode(p.postalCode);
        setPhone(p.phone);
        setEmail(p.email);
        setWebsite(p.website);
        setSpecialtiesText(p.services.join(", "));
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, supabaseEnabled]);

  const onSave = useCallback(async () => {
    setError(null);
    if (!supabaseEnabled || !id) {
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
      await updateProviderForCurrentUser(id, {
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
  }, [
    supabaseEnabled,
    id,
    name,
    address,
    city,
    province,
    postalCode,
    phone,
    email,
    website,
    specialtiesText,
  ]);

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Configure Supabase to edit providers.</Text>
      </View>
    );
  }

  if (loading) {
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <CatalogLoadState loading={catalogs.loading} error={catalogs.error} />
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Street address</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textLight} value={address} onChangeText={setAddress} />

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
          placeholder="Comma-separated"
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
            <Text style={styles.saveText}>Save changes</Text>
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
