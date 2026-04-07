import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Appointment } from "../../../src/domain/appointment";
import { formatDisplayDateTime } from "../../../src/lib/datetime";
import { fetchAppointmentByIdForCurrentUser } from "../../../src/repositories/appointment.repository";
import { appStrings } from "../../../src/strings/appStrings";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

function statusLabel(s: Appointment["status"]): string {
  switch (s) {
    case "scheduled":
      return "Scheduled";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return s;
  }
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseEnabled || !id) {
      setAppointment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchAppointmentByIdForCurrentUser(id);
      setAppointment(row);
      if (!row) {
        setError("Appointment not found.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [supabaseEnabled, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Connect Supabase to view appointments.</Text>
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

  if (error || !appointment) {
    return (
      <View style={styles.padded}>
        <Text style={styles.err}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const a = appointment;
  const titleLine =
    a.appointmentKind === "treatment" && a.treatmentType
      ? `${a.treatmentType} · ${a.serviceType}`
      : a.serviceType;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Text style={styles.kind}>
        {a.appointmentKind === "consult"
          ? appStrings.appointmentKindConsult
          : appStrings.appointmentKindTreatment}
      </Text>
      <Text style={styles.title}>{titleLine}</Text>
      <Text style={styles.sub}>{formatDisplayDateTime(a.scheduledAt)}</Text>
      <Text style={styles.sub}>
        {appStrings.appointmentProviderLine}: {a.providerName?.trim() || appStrings.appointmentNoProvider}
      </Text>

      {a.brand ? <Text style={styles.sub}>{a.brand}</Text> : null}
      {a.durationMinutes != null ? (
        <Text style={styles.sub}>
          {appStrings.appointmentDurationLabel}: {a.durationMinutes} min
        </Text>
      ) : null}

      <Text style={styles.label}>{appStrings.appointmentStatusLabel}</Text>
      <Text style={styles.body}>{statusLabel(a.status)}</Text>

      {a.notes.trim() !== "" ? (
        <>
          <Text style={styles.label}>{appStrings.appointmentNotesLabel}</Text>
          <Text style={styles.body}>{a.notes}</Text>
        </>
      ) : null}

      {a.providerId ? (
        <Pressable style={styles.linkBtn} onPress={() => router.push(`/providers/${a.providerId}`)}>
          <Text style={styles.linkBtnText}>{appStrings.navProviders}</Text>
        </Pressable>
      ) : null}

      {a.status === "scheduled" ? (
        <Pressable style={styles.editBtn} onPress={() => router.push(`/appointments/edit/${a.id}`)}>
          <Text style={styles.editBtnText}>{appStrings.appointmentEditCta}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  scroll: { padding: 16, paddingBottom: 32 },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  err: { color: colors.errorRed },
  kind: { fontSize: 12, fontWeight: "700", color: colors.primaryNavy, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.primaryNavy },
  sub: { marginTop: 8, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  label: { marginTop: 20, fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  body: { marginTop: 6, fontSize: 16, color: colors.textPrimary, lineHeight: 24 },
  linkBtn: {
    marginTop: 20,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryNavy,
  },
  linkBtnText: { color: colors.primaryNavy, fontWeight: "600" },
  editBtn: {
    marginTop: 16,
    backgroundColor: colors.primaryGold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtnText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 16 },
});
