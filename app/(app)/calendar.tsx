import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Appointment } from "../../src/domain/appointment";
import type { Treatment } from "../../src/domain/treatment";
import { formatDisplayDate, formatDisplayDateTime } from "../../src/lib/datetime";
import {
  appointmentServiceLine,
  treatmentServiceLine,
  treatmentTypeDisplayLabel,
} from "../../src/lib/treatment-service-line";
import { fetchAppointmentsForCurrentUser } from "../../src/repositories/appointment.repository";
import {
  fetchTreatmentsForCurrentUser,
  readCachedTreatmentsForCurrentUser,
} from "../../src/repositories/treatment.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

const ebdLineLabels = {
  laserModality: appStrings.ebdModalityLaser,
  photofacialModality: appStrings.ebdModalityPhotofacial,
};

type CalendarRow =
  | { rowType: "treatment"; treatment: Treatment }
  | { rowType: "appointment"; appointment: Appointment };

type Section = { title: string; data: CalendarRow[] };

function dayKeyFromTreatment(t: Treatment): string {
  return format(t.treatmentDate, "yyyy-MM-dd");
}

function dayKeyFromAppointment(a: Appointment): string {
  return format(a.scheduledAt, "yyyy-MM-dd");
}

function groupCalendarRows(treatments: Treatment[], appointments: Appointment[]): Section[] {
  const map = new Map<string, CalendarRow[]>();

  for (const t of treatments) {
    const key = dayKeyFromTreatment(t);
    const list = map.get(key) ?? [];
    list.push({ rowType: "treatment", treatment: t });
    map.set(key, list);
  }
  for (const a of appointments) {
    if (a.status !== "scheduled") {
      continue;
    }
    const key = dayKeyFromAppointment(a);
    const list = map.get(key) ?? [];
    list.push({ rowType: "appointment", appointment: a });
    map.set(key, list);
  }

  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((key) => {
    const data = (map.get(key) ?? []).sort((x, y) => {
      const tx =
        x.rowType === "treatment"
          ? x.treatment.treatmentDate.getTime()
          : x.appointment.scheduledAt.getTime();
      const ty =
        y.rowType === "treatment"
          ? y.treatment.treatmentDate.getTime()
          : y.appointment.scheduledAt.getTime();
      return ty - tx;
    });
    return {
      title: formatDisplayDate(parseISO(`${key}T12:00:00`)),
      data,
    };
  });
}

export default function CalendarScreen() {
  const { supabaseEnabled } = useSession();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseEnabled) {
      setTreatments([]);
      setAppointments([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const cached = await readCachedTreatmentsForCurrentUser();
      if (cached != null) {
        setTreatments(cached);
      }
      const [tRows, aRows] = await Promise.all([
        fetchTreatmentsForCurrentUser(),
        fetchAppointmentsForCurrentUser(),
      ]);
      setTreatments(tRows);
      setAppointments(aRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      const stale = await readCachedTreatmentsForCurrentUser();
      setTreatments(stale ?? []);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sections = useMemo(
    () => groupCalendarRows(treatments, appointments),
    [treatments, appointments],
  );

  if (!supabaseEnabled) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Connect Supabase to see your calendar.</Text>
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

  return (
    <View style={styles.flex}>
      <Pressable style={styles.addBtn} onPress={() => router.push("/appointments/new")}>
        <Text style={styles.addBtnText}>{appStrings.addAppointmentCta}</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Text style={styles.hint}>{appStrings.calendarListHint}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.rowType === "treatment" ? `t-${item.treatment.id}` : `a-${item.appointment.id}`
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) =>
          item.rowType === "treatment" ? (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/treatments/${item.treatment.id}`)}
            >
              <Text style={styles.badge}>Treatment</Text>
              <Text style={styles.cardTitle}>
                {treatmentTypeDisplayLabel(item.treatment.treatmentType)} ·{" "}
                {treatmentServiceLine(item.treatment, ebdLineLabels)}
              </Text>
              <Text style={styles.cardSub}>{item.treatment.brand || "—"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.card, styles.cardAppt]}
              onPress={() => router.push(`/appointments/${item.appointment.id}`)}
            >
              <Text style={styles.badgeAppt}>
                {item.appointment.appointmentKind === "consult" ? appStrings.appointmentKindConsult : appStrings.appointmentKindTreatment}
              </Text>
              <Text style={styles.cardTitle}>
                {item.appointment.appointmentKind === "treatment" && item.appointment.treatmentType
                  ? `${treatmentTypeDisplayLabel(item.appointment.treatmentType)} · ${appointmentServiceLine(item.appointment, ebdLineLabels)}`
                  : item.appointment.serviceType}
              </Text>
              <Text style={styles.cardSub}>{formatDisplayDateTime(item.appointment.scheduledAt)}</Text>
              <Text style={styles.cardSub}>
                {item.appointment.providerName?.trim()
                  ? item.appointment.providerName
                  : appStrings.appointmentNoProvider}
              </Text>
              {item.appointment.brand ? <Text style={styles.cardSub}>{item.appointment.brand}</Text> : null}
            </Pressable>
          )
        }
        ListEmptyComponent={<Text style={styles.empty}>{appStrings.calendarEmpty}</Text>}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  padded: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  muted: { color: colors.textSecondary, lineHeight: 22 },
  err: { color: colors.errorRed, paddingHorizontal: 16, paddingBottom: 8 },
  addBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.primaryGold,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  addBtnText: { color: colors.primaryNavy, fontWeight: "700", fontSize: 15 },
  hint: { paddingHorizontal: 16, paddingVertical: 8, color: colors.textSecondary, fontSize: 13 },
  sectionHead: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.primaryNavy },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: colors.cleanWhite,
    borderRadius: 10,
  },
  cardAppt: { borderLeftWidth: 4, borderLeftColor: colors.primaryGold },
  badge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  badgeAppt: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryNavy,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.primaryNavy },
  cardSub: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  empty: { padding: 24, textAlign: "center", color: colors.textSecondary },
});
