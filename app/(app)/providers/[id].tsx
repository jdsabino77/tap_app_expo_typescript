import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { providerFullAddress } from "../../../src/domain/provider";
import { isWriteQueuedError } from "../../../src/lib/write-queued-error";
import {
  deactivateProviderForCurrentUser,
  fetchProviderByIdForCurrentUser,
} from "../../../src/repositories/provider.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canMutate, setCanMutate] = useState(false);
  const [name, setName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [servicesLine, setServicesLine] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseEnabled || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProviderByIdForCurrentUser(id);
      if (!res) {
        setError("Provider not found.");
        return;
      }
      const { provider, canMutate: mut } = res;
      setCanMutate(mut);
      setName(provider.name);
      setAddressLine(providerFullAddress(provider));
      setServicesLine(provider.services.join(" · "));
      setPhone(provider.phone);
      setEmail(provider.email);
      setWebsite(provider.website);
      setIsGlobal(provider.isGlobal);
      setLogoUrl(provider.logoUrl);
      setIsActive(provider.isActive);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRemove = () => {
    if (!id || !canMutate) {
      return;
    }
    Alert.alert(
      "Remove from your list",
      "This hides the provider from your directory. Past treatments that reference them stay intact.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setRemoving(true);
            void deactivateProviderForCurrentUser(id)
              .then(() => {
                router.back();
              })
              .catch((e) => {
                if (isWriteQueuedError(e)) {
                  Alert.alert("Queued for sync", e.message, [{ text: "OK", onPress: () => router.back() }]);
                  return;
                }
                Alert.alert("Could not remove", e instanceof Error ? e.message : "Error");
              })
              .finally(() => {
                setRemoving(false);
              });
          },
        },
      ],
    );
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Enable Supabase to load provider details.</Text>
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

  if (error) {
    return (
      <View style={styles.padded}>
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }

  const showLogo = isGlobal && logoUrl.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>{name}</Text>
      {showLogo ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel={`${name} logo`}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {isGlobal ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Clinic directory</Text>
        </View>
      ) : (
        <View style={styles.badgeMuted}>
          <Text style={styles.badgeMutedText}>Your provider</Text>
        </View>
      )}
      {!isActive ? <Text style={styles.inactive}>Inactive (hidden from list)</Text> : null}

      <Text style={styles.section}>Address</Text>
      <Text style={styles.line}>{addressLine || "—"}</Text>

      {servicesLine ? (
        <>
          <Text style={styles.section}>Services / specialties</Text>
          <Text style={styles.line}>{servicesLine}</Text>
        </>
      ) : null}

      <Text style={styles.section}>Phone</Text>
      <Text style={styles.line}>{phone || "—"}</Text>

      <Text style={styles.section}>Email</Text>
      <Text style={styles.line}>{email || "—"}</Text>

      {website ? (
        <>
          <Text style={styles.section}>Website</Text>
          <Text style={styles.line}>{website}</Text>
        </>
      ) : null}

      {canMutate ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push(`/providers/edit/${id}`)}
          >
            <Text style={styles.primaryBtnText}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.dangerBtn, removing && styles.disabled]}
            onPress={onRemove}
            disabled={removing}
          >
            <Text style={styles.dangerBtnText}>{removing ? "…" : "Remove from list"}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.hint}>Directory entries cannot be edited in the app.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  title: { fontSize: 22, fontWeight: "700", color: colors.primaryNavy },
  logo: {
    marginTop: 12,
    width: "100%",
    maxWidth: 200,
    height: 96,
    borderRadius: 8,
    backgroundColor: colors.borderSubtle,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.infoBlue,
  },
  badgeText: { color: colors.cleanWhite, fontSize: 12, fontWeight: "600" },
  badgeMuted: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.borderSubtle,
  },
  badgeMutedText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  inactive: { marginTop: 8, color: colors.errorRed, fontWeight: "600" },
  section: { marginTop: 20, fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  line: { marginTop: 6, fontSize: 16, color: colors.textPrimary, lineHeight: 22 },
  actions: { marginTop: 28, gap: 12 },
  primaryBtn: {
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
  dangerBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.errorRed,
  },
  dangerBtnText: { color: colors.errorRed, fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
  hint: { marginTop: 24, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.textSecondary },
  err: { color: colors.errorRed },
});
