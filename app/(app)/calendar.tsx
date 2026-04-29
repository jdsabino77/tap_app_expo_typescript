import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Appointment } from "../../src/domain/appointment";
import type { Treatment } from "../../src/domain/treatment";
import {
  defaultCalendarDateFilterState,
  filterAppointmentsByCalendarRange,
  filterTreatmentsByCalendarRange,
  getCalendarDateRange,
  type CalendarDateFilterState,
} from "../../src/lib/calendar-date-filter";
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
import {
  readCalendarListFilterPrefs,
  writeCalendarListFilterPrefs,
} from "../../src/services/local/list-filter-preferences";
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

function calendarActiveFilterLabel(state: CalendarDateFilterState): string {
  if (state.kind === "all") {
    return appStrings.filterDateAllTime;
  }
  if (state.kind === "preset") {
    switch (state.preset) {
      case "thisMonth":
        return appStrings.filterDateThisMonth;
      case "thisYear":
        return appStrings.filterDateThisYear;
      case "last3Months":
        return appStrings.filterDateLast3Months;
    }
  }
  return format(new Date(state.year, state.month, 1), "MMMM yyyy");
}

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** Newest first: current year, then past years descending; future years (for scheduling) at the end. */
function yearOptions(): number[] {
  const y = new Date().getFullYear();
  const out: number[] = [];
  for (let yr = y; yr >= y - 10; yr -= 1) {
    out.push(yr);
  }
  out.push(y + 1, y + 2);
  return out;
}

export default function CalendarScreen() {
  const { supabaseEnabled, userId } = useSession();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<CalendarDateFilterState>(defaultCalendarDateFilterState);
  const [monthYearOpen, setMonthYearOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState(0);
  const [draftYear, setDraftYear] = useState(new Date().getFullYear());
  const [calendarPrefsHydrated, setCalendarPrefsHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCalendarPrefsHydrated(false);
      return;
    }
    let cancel = false;
    setCalendarPrefsHydrated(false);
    void readCalendarListFilterPrefs(userId).then((s) => {
      if (!cancel) {
        setDateFilter(s);
        setCalendarPrefsHydrated(true);
      }
    });
    return () => {
      cancel = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !calendarPrefsHydrated) {
      return;
    }
    const t = setTimeout(() => {
      void writeCalendarListFilterPrefs(userId, dateFilter);
    }, 300);
    return () => clearTimeout(t);
  }, [userId, calendarPrefsHydrated, dateFilter]);

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

  const dateRange = useMemo(
    () => getCalendarDateRange(dateFilter, new Date()),
    [dateFilter],
  );

  const filteredTreatments = useMemo(
    () => filterTreatmentsByCalendarRange(treatments, dateRange),
    [treatments, dateRange],
  );
  const filteredAppointments = useMemo(
    () => filterAppointmentsByCalendarRange(appointments, dateRange),
    [appointments, dateRange],
  );

  const hasAnySourceData = treatments.length > 0 || appointments.length > 0;
  const sections = useMemo(
    () => groupCalendarRows(filteredTreatments, filteredAppointments),
    [filteredTreatments, filteredAppointments],
  );

  const openMonthYearModal = useCallback(() => {
    if (dateFilter.kind === "monthYear") {
      setDraftMonth(dateFilter.month);
      setDraftYear(dateFilter.year);
    } else {
      const n = new Date();
      setDraftMonth(n.getMonth());
      setDraftYear(n.getFullYear());
    }
    setMonthYearOpen(true);
  }, [dateFilter]);

  const applyMonthYear = useCallback(() => {
    setDateFilter({ kind: "monthYear", month: draftMonth, year: draftYear });
    setMonthYearOpen(false);
  }, [draftMonth, draftYear]);

  const filterActive = dateFilter.kind !== "all";

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

      <View style={styles.filterBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <FilterChip
            label={appStrings.filterDateAllTime}
            selected={dateFilter.kind === "all"}
            onPress={() => setDateFilter({ kind: "all" })}
          />
          <FilterChip
            label={appStrings.filterDateThisMonth}
            selected={dateFilter.kind === "preset" && dateFilter.preset === "thisMonth"}
            onPress={() => setDateFilter({ kind: "preset", preset: "thisMonth" })}
          />
          <FilterChip
            label={appStrings.filterDateLast3Months}
            selected={dateFilter.kind === "preset" && dateFilter.preset === "last3Months"}
            onPress={() => setDateFilter({ kind: "preset", preset: "last3Months" })}
          />
          <FilterChip
            label={appStrings.filterDateThisYear}
            selected={dateFilter.kind === "preset" && dateFilter.preset === "thisYear"}
            onPress={() => setDateFilter({ kind: "preset", preset: "thisYear" })}
          />
          <FilterChip
            label={appStrings.filterDateChooseMonth}
            selected={dateFilter.kind === "monthYear"}
            onPress={openMonthYearModal}
          />
        </ScrollView>
        {filterActive ? (
          <View style={styles.activeRow}>
            <Text style={styles.activeText} numberOfLines={2}>
              {appStrings.filterActivePrefix} {calendarActiveFilterLabel(dateFilter)}
            </Text>
            <Pressable
              onPress={() => setDateFilter(defaultCalendarDateFilterState)}
              accessibilityRole="button"
            >
              <Text style={styles.clearLink}>{appStrings.filterClear}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Text style={styles.hint}>{appStrings.calendarListHint}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.rowType === "treatment" ? `t-${item.treatment.id}` : `a-${item.appointment.id}`
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
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
                {item.appointment.appointmentKind === "consult"
                  ? appStrings.appointmentKindConsult
                  : appStrings.appointmentKindTreatment}
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
        ListEmptyComponent={
          <Text style={styles.empty}>
            {hasAnySourceData ? appStrings.filterCalendarNoMatches : appStrings.calendarEmpty}
          </Text>
        }
        stickySectionHeadersEnabled
      />

      <Modal visible={monthYearOpen} transparent animationType="fade">
        <Pressable style={styles.modalScrim} onPress={() => setMonthYearOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{appStrings.filterDateModalTitle}</Text>
            <Text style={styles.modalSectionLabel}>{appStrings.filterMonthLabel}</Text>
            <View style={styles.monthGrid}>
              {MONTHS.map((m) => {
                const selected = draftMonth === m;
                return (
                  <Pressable
                    key={m}
                    style={[styles.monthCell, selected && styles.monthCellSelected]}
                    onPress={() => setDraftMonth(m)}
                  >
                    <Text style={[styles.monthCellText, selected && styles.monthCellTextSelected]}>
                      {format(new Date(2026, m, 1), "MMM")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.modalSectionLabel, { marginTop: 12 }]}>{appStrings.filterYearLabel}</Text>
            <ScrollView style={styles.yearScroll} nestedScrollEnabled>
              {yearOptions().map((y) => {
                const selected = draftYear === y;
                return (
                  <Pressable
                    key={y}
                    style={[styles.yearRow, selected && styles.yearRowSelected]}
                    onPress={() => setDraftYear(y)}
                  >
                    <Text style={[styles.yearRowText, selected && styles.yearRowTextSelected]}>{y}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnGhost} onPress={() => setMonthYearOpen(false)}>
                <Text style={styles.modalBtnGhostText}>{appStrings.filterCancel}</Text>
              </Pressable>
              <Pressable style={styles.modalBtnPrimary} onPress={applyMonthYear}>
                <Text style={styles.modalBtnPrimaryText}>{appStrings.filterApply}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
  filterBlock: { marginBottom: 4 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipSelected: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.primaryNavy },
  chipTextSelected: { color: colors.cleanWhite },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  activeText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  clearLink: { fontSize: 13, fontWeight: "600", color: colors.infoBlue },
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
  modalScrim: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    padding: 16,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryNavy, marginBottom: 12 },
  modalSectionLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  monthCell: {
    width: "31%",
    marginBottom: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  monthCellSelected: { backgroundColor: colors.primaryNavy },
  monthCellText: { fontSize: 14, fontWeight: "600", color: colors.primaryNavy },
  monthCellTextSelected: { color: colors.cleanWhite },
  yearScroll: { maxHeight: 160 },
  yearRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: colors.lightGray,
  },
  yearRowSelected: { backgroundColor: colors.primaryNavy },
  yearRowText: { fontSize: 15, fontWeight: "600", color: colors.primaryNavy },
  yearRowTextSelected: { color: colors.cleanWhite },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  modalBtnGhost: { paddingVertical: 10, paddingHorizontal: 12 },
  modalBtnGhostText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  modalBtnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryGold,
    borderRadius: 8,
  },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: colors.primaryNavy },
});
