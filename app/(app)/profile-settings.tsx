import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { appStrings } from "../../src/strings/appStrings";
import {
  fetchOwnProfileRow,
  updateOwnProfileBasics,
  type ProfileRow,
} from "../../src/repositories/profile.repository";
import {
  deleteProfileAvatarPaths,
  isProfileAvatarStoragePath,
  signedUrlForProfileAvatarPath,
  uploadProfileAvatarFile,
} from "../../src/services/supabase/profile-avatar";
import { getSupabase } from "../../src/services/supabase/client";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

const emailFieldSchema = z.string().trim().email({ message: "invalid" });

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

export default function ProfileSettingsScreen() {
  const {
    supabaseEnabled,
    userId,
    email: sessionEmail,
    pendingNewEmail,
    refreshAuthSession,
    requestAuthEmailChange,
  } = useSession();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [row, setRow] = useState<ProfileRow | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [saving, setSaving] = useState(false);

  const resolveAvatarDisplay = useCallback(async (profile: ProfileRow | null) => {
    if (!profile?.photo_url) {
      setAvatarUri(null);
      return;
    }
    const p = profile.photo_url;
    if (p.startsWith("http://") || p.startsWith("https://")) {
      setAvatarUri(p);
      return;
    }
    if (isProfileAvatarStoragePath(p)) {
      const supabase = getSupabase();
      const signed = await signedUrlForProfileAvatarPath(supabase, p);
      setAvatarUri(signed);
      return;
    }
    setAvatarUri(null);
  }, []);

  const load = useCallback(async () => {
    if (!supabaseEnabled) {
      setLoading(false);
      setRow(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const p = await fetchOwnProfileRow();
      setRow(p);
      if (p) {
        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setEmailInput(p.email ?? sessionEmail ?? "");
        setPendingPick(null);
        setRemovePhoto(false);
        await resolveAvatarDisplay(p);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [supabaseEnabled, sessionEmail, resolveAvatarDisplay]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onPickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(appStrings.photoPermissionDeniedTitle, appStrings.photoPermissionDeniedMessage, [
        { text: "Cancel", style: "cancel" },
        { text: appStrings.photoPermissionOpenSettings, onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.88,
    });
    if (res.canceled || !res.assets[0]) {
      return;
    }
    const a = res.assets[0];
    setPendingPick({ uri: a.uri, mimeType: a.mimeType ?? undefined });
    setRemovePhoto(false);
    setAvatarUri(a.uri);
  };

  const onRemovePhoto = () => {
    setPendingPick(null);
    setRemovePhoto(true);
    setAvatarUri(null);
  };

  const onSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn.length || !ln.length) {
      Alert.alert("Missing name", appStrings.profileSettingsNameRequired);
      return;
    }
    const trimmedEmail = emailInput.trim();
    const parsed = emailFieldSchema.safeParse(trimmedEmail);
    if (!parsed.success) {
      Alert.alert("Email", appStrings.profileSettingsEmailInvalid);
      return;
    }

    setSaving(true);
    let emailChangeRequested = false;
    try {
      const supabase = getSupabase();
      const currentRow = row;
      if (!currentRow?.id) {
        throw new Error("Profile not loaded");
      }

      const previousStoragePath =
        currentRow.photo_url && isProfileAvatarStoragePath(currentRow.photo_url)
          ? currentRow.photo_url
          : null;

      let nextPhotoUrl: string | null | undefined = undefined;
      if (removePhoto) {
        nextPhotoUrl = null;
      } else if (pendingPick) {
        const path = await uploadProfileAvatarFile(supabase, currentRow.id, pendingPick);
        nextPhotoUrl = path;
      }

      await updateOwnProfileBasics({
        firstName: fn,
        lastName: ln,
        photoUrl: nextPhotoUrl,
      });

      if (
        previousStoragePath &&
        (removePhoto || pendingPick) &&
        previousStoragePath !== (typeof nextPhotoUrl === "string" ? nextPhotoUrl : null)
      ) {
        try {
          await deleteProfileAvatarPaths(supabase, [previousStoragePath]);
        } catch {
          /* best-effort cleanup; new file is already referenced on profile */
        }
      }

      const sessionNorm = sessionEmail ? normalizeEmail(sessionEmail) : "";
      if (normalizeEmail(trimmedEmail) !== sessionNorm) {
        const { error } = await requestAuthEmailChange(trimmedEmail);
        if (error) {
          Alert.alert(
            "Profile updated",
            `${appStrings.profileSettingsSavedBody}\n\nEmail was not changed: ${error}`,
          );
        } else {
          emailChangeRequested = true;
        }
      }

      await refreshAuthSession();
      await load();

      if (emailChangeRequested) {
        Alert.alert(appStrings.profileSettingsEmailConfirmTitle, appStrings.profileSettingsEmailConfirmBody);
      } else {
        Alert.alert(appStrings.profileSettingsSavedTitle, appStrings.profileSettingsSavedBody);
      }
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.muted}>{appStrings.profileSettingsStubUnavailable}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  if (loadError || !row || !userId) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.errorText}>{loadError ?? "Profile unavailable"}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const initial = (firstName.trim().charAt(0) || lastName.trim().charAt(0) || "?").toUpperCase();
  const createdLabel = (() => {
    try {
      return format(parseISO(row.created_at), "MMMM d, yyyy");
    } catch {
      return row.created_at;
    }
  })();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {pendingNewEmail ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{appStrings.profileSettingsPendingEmailBanner(pendingNewEmail)}</Text>
        </View>
      ) : null}

      <Text style={styles.intro}>{appStrings.profileSettingsIntro}</Text>

      <View style={styles.avatarBlock}>
        <Pressable style={styles.avatarRing} onPress={() => void onPickPhoto()} disabled={saving}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.avatarHint}>{appStrings.profileSettingsAvatarHint}</Text>
        <View style={styles.photoActions}>
          <Pressable onPress={() => void onPickPhoto()} disabled={saving}>
            <Text style={styles.link}>{appStrings.profileSettingsChangePhoto}</Text>
          </Pressable>
          {(row.photo_url || pendingPick) && !removePhoto ? (
            <Pressable onPress={onRemovePhoto} disabled={saving}>
              <Text style={styles.linkDanger}>{appStrings.profileSettingsRemovePhoto}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={styles.label}>{appStrings.profileSettingsFirstName}</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        placeholder={appStrings.firstNamePlaceholder}
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.label}>{appStrings.profileSettingsLastName}</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        placeholder={appStrings.lastNamePlaceholder}
        style={styles.input}
        editable={!saving}
      />

      <Text style={styles.label}>{appStrings.profileSettingsEmail}</Text>
      <TextInput
        value={emailInput}
        onChangeText={setEmailInput}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        placeholder="you@example.com"
        style={styles.input}
        editable={!saving}
      />

      <View style={styles.readonlyCard}>
        <Text style={styles.readonlyLabel}>{appStrings.profileSettingsUserId}</Text>
        <Text style={styles.readonlyValue} selectable>
          {userId}
        </Text>
        <Text style={[styles.readonlyLabel, styles.readonlySpaced]}>{appStrings.profileSettingsAccountCreated}</Text>
        <Text style={styles.readonlyValue}>{createdLabel}</Text>
      </View>

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={() => void onSave()} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.primaryNavy} />
        ) : (
          <Text style={styles.saveLabel}>{appStrings.profileSettingsSave}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  centerFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.lightGray,
  },
  intro: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  banner: {
    backgroundColor: "rgba(23, 162, 184, 0.12)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.infoBlue,
  },
  bannerText: { color: colors.primaryNavy, fontSize: 14, lineHeight: 20 },
  avatarBlock: { alignItems: "center", marginBottom: 24 },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.borderMuted,
    backgroundColor: colors.cleanWhite,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderSubtle,
  },
  avatarInitial: { fontSize: 40, fontWeight: "700", color: colors.primaryNavy },
  avatarHint: { marginTop: 10, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  photoActions: { flexDirection: "row", gap: 20, marginTop: 12 },
  link: { fontSize: 16, color: colors.primaryNavy, fontWeight: "600" },
  linkDanger: { fontSize: 16, color: colors.errorRed, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: colors.primaryNavy, marginBottom: 8 },
  input: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 18,
  },
  readonlyCard: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  readonlyLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  readonlySpaced: { marginTop: 14 },
  readonlyValue: { fontSize: 15, color: colors.textPrimary, marginTop: 4 },
  saveBtn: {
    backgroundColor: colors.primaryGold,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveLabel: { color: colors.primaryNavy, fontSize: 17, fontWeight: "700" },
  muted: { textAlign: "center", color: colors.textSecondary, fontSize: 15 },
  errorText: { color: colors.errorRed, textAlign: "center", marginBottom: 16 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primaryNavy, borderRadius: 8 },
  retryLabel: { color: colors.cleanWhite, fontWeight: "600" },
});
