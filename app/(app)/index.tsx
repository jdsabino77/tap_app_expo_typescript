import { Link, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Appointment } from "../../src/domain/appointment";
import type { Treatment } from "../../src/domain/treatment";
import { formatDisplayDate, formatDisplayDateTime } from "../../src/lib/datetime";
import {
  appointmentServiceLine,
  treatmentServiceLine,
  treatmentTypeDisplayLabel,
} from "../../src/lib/treatment-service-line";
import { fetchUpcomingAppointmentsForCurrentUser } from "../../src/repositories/appointment.repository";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { fetchTreatmentsForCurrentUser } from "../../src/repositories/treatment.repository";
import { appStrings } from "../../src/strings/appStrings";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useSession } from "../../src/store/session";
import { colors } from "../../src/theme/tokens";

const ebdLineLabels = {
  laserModality: appStrings.ebdModalityLaser,
  photofacialModality: appStrings.ebdModalityPhotofacial,
};

function HubRow({
  href,
  label,
}: {
  href:
    | "/treatments"
    | "/face-map"
    | "/skin-analyzer"
    | "/providers"
    | "/medical-profile"
    | "/calendar"
    | "/settings";
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.hubRow}>
        <Text style={styles.hubRowText}>{label}</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    </Link>
  );
}

function QuickActionCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.qaCard} onPress={onPress}>
      <Text style={styles.qaTitle}>{title}</Text>
      <Text style={styles.qaSub}>{subtitle}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const net = useNetworkStatus();
  const { supabaseEnabled, email } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [treatmentCount, setTreatmentCount] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [recent, setRecent] = useState<Treatment[] | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [upcoming, setUpcoming] = useState<Appointment[] | null>(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled) {
        return;
      }
      let cancelled = false;
      setLoadingProfile(true);
      void fetchOwnProfileRow()
        .then((row) => {
          if (cancelled || !row) {
            return;
          }
          const dn =
            row.display_name?.trim() ||
            [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
            row.email;
          setDisplayName(dn ?? null);
          setTreatmentCount(row.treatment_count ?? 0);
        })
        .catch(() => {
          if (!cancelled) {
            setDisplayName(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingProfile(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [supabaseEnabled, email]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled) {
        setRecent(null);
        return;
      }
      let cancelled = false;
      setLoadingRecent(true);
      void fetchTreatmentsForCurrentUser()
        .then((rows) => {
          if (!cancelled) {
            setRecent(rows.slice(0, 3));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRecent([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingRecent(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [supabaseEnabled, email]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!supabaseEnabled) {
        setUpcoming(null);
        return;
      }
      let cancelled = false;
      setLoadingUpcoming(true);
      void fetchUpcomingAppointmentsForCurrentUser(new Date(), 5)
        .then((rows) => {
          if (!cancelled) {
            setUpcoming(rows);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUpcoming([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingUpcoming(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [supabaseEnabled, email]),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      automaticallyAdjustsScrollIndicatorInsets={false}
    >
      <View style={styles.dashboardBanner}>
        <View style={styles.dashboardBannerCrop}>
          <Image
            source={require("../../assets/branding/splash-logo.jpg")}
            style={styles.dashboardBannerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
      {net === "offline" ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{appStrings.offlineBanner}</Text>
        </View>
      ) : null}

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>{appStrings.welcomeBackTitle}</Text>
        <Text style={styles.welcomeSub}>{appStrings.welcomeBackSubtitle}</Text>
        {loadingProfile ? (
          <ActivityIndicator color={colors.primaryNavy} style={styles.inlineLoader} />
        ) : supabaseEnabled ? (
          <>
            {displayName ? (
              <Text style={styles.signedInMeta}>{displayName}</Text>
            ) : email ? (
              <Text style={styles.signedInMeta}>{email}</Text>
            ) : null}
            {treatmentCount != null ? (
              <Text style={styles.countMeta}>{appStrings.treatmentsLogged(treatmentCount)}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.signedInMeta}>Dashboard (stub)</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>{appStrings.quickActions}</Text>
      <View style={styles.qaRow}>
        <QuickActionCard
          title={appStrings.quickActionNewTreatment}
          subtitle={appStrings.quickActionNewTreatmentSub}
          onPress={() => router.push("/treatments/new")}
        />
        <QuickActionCard
          title={appStrings.quickActionFaceMap}
          subtitle={appStrings.quickActionFaceMapSub}
          onPress={() => router.push("/face-map")}
        />
      </View>
      <View style={styles.qaRow}>
        <QuickActionCard
          title={appStrings.quickActionProviders}
          subtitle={appStrings.quickActionProvidersSub}
          onPress={() => router.push("/providers")}
        />
        <QuickActionCard
          title={appStrings.quickActionCalendar}
          subtitle={appStrings.quickActionCalendarSub}
          onPress={() => router.push("/calendar")}
        />
      </View>
      <View style={styles.qaRow}>
        <QuickActionCard
          title={appStrings.quickActionProfile}
          subtitle={appStrings.quickActionProfileSub}
          onPress={() => router.push("/medical-profile")}
        />
        <QuickActionCard
          title={appStrings.quickActionSkinAnalyzer}
          subtitle={appStrings.quickActionSkinAnalyzerSub}
          onPress={() => router.push("/skin-analyzer")}
        />
      </View>
      <View style={styles.qaRow}>
        <QuickActionCard
          title={appStrings.quickActionPhotoLibrary}
          subtitle={appStrings.quickActionPhotoLibrarySub}
          onPress={() => router.push("/photo-library")}
        />
      </View>

      <Text style={styles.sectionTitle}>{appStrings.upcomingAppointments}</Text>
      {!supabaseEnabled ? (
        <Text style={styles.muted}>Connect Supabase to load appointments.</Text>
      ) : loadingUpcoming ? (
        <View style={styles.recentLoading}>
          <ActivityIndicator color={colors.primaryNavy} />
        </View>
      ) : upcoming != null && upcoming.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptySub}>{appStrings.noUpcomingAppointments}</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push("/appointments/new")}>
            <Text style={styles.emptyBtnText}>{appStrings.addAppointmentCta}</Text>
          </Pressable>
        </View>
      ) : (
        (upcoming ?? []).map((a) => (
          <Pressable key={a.id} style={styles.apptCard} onPress={() => router.push(`/appointments/${a.id}`)}>
            <Text style={styles.apptKind}>
              {a.appointmentKind === "consult"
                ? appStrings.appointmentKindConsult
                : appStrings.appointmentKindTreatment}
            </Text>
            <Text style={styles.recentTitle}>
              {a.appointmentKind === "treatment" && a.treatmentType
                ? `${treatmentTypeDisplayLabel(a.treatmentType)} · ${appointmentServiceLine(a, ebdLineLabels)}`
                : a.serviceType}
            </Text>
            <Text style={styles.recentSub}>{formatDisplayDateTime(a.scheduledAt)}</Text>
            <Text style={styles.recentSub}>
              {a.providerName?.trim() ? a.providerName : appStrings.appointmentNoProvider}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>{appStrings.recentTreatments}</Text>
      {!supabaseEnabled ? (
        <Text style={styles.muted}>Connect Supabase to load recent treatments.</Text>
      ) : loadingRecent ? (
        <View style={styles.recentLoading}>
          <ActivityIndicator color={colors.primaryNavy} />
        </View>
      ) : recent != null && recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{appStrings.noTreatmentsYet}</Text>
          <Text style={styles.emptySub}>{appStrings.noTreatmentsHint}</Text>
          <Link href="/treatments/new" asChild>
            <Pressable style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{appStrings.addFirstTreatment}</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        (recent ?? []).map((t) => (
          <Pressable
            key={t.id}
            style={styles.recentCard}
            onPress={() => router.push(`/treatments/${t.id}`)}
          >
            <Text style={styles.recentTitle}>
              {treatmentTypeDisplayLabel(t.treatmentType)} · {treatmentServiceLine(t, ebdLineLabels)}
            </Text>
            <Text style={styles.recentSub}>{formatDisplayDate(t.treatmentDate)}</Text>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>More</Text>
      <HubRow href="/treatments" label={appStrings.navTreatments} />
      <HubRow href="/providers" label={appStrings.navProviders} />
      <HubRow href="/calendar" label={appStrings.navCalendar} />
      <HubRow href="/face-map" label={appStrings.navFaceMap} />
      <HubRow href="/skin-analyzer" label={appStrings.navSkinAnalyzer} />
      <HubRow href="/medical-profile" label={appStrings.navMedicalProfile} />
      <HubRow href="/settings" label={appStrings.navSettings} />

      <View style={styles.footerLinks}>
        <Link href="/legal/privacy" asChild>
          <Pressable style={styles.footerWrap}>
            <Text style={styles.footer}>{appStrings.privacyPolicy}</Text>
          </Pressable>
        </Link>
        <Text style={styles.footerSep}> · </Text>
        <Link href="/legal/terms" asChild>
          <Pressable style={styles.footerWrap}>
            <Text style={styles.footer}>{appStrings.termsAndConditions}</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.lightGray },
  scrollContent: { paddingBottom: 32 },
  dashboardBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
    paddingVertical: 0,
  },
  dashboardBannerCrop: {
    width: "100%",
    maxWidth: 420,
    height: 96,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  dashboardBannerLogo: {
    width: 500,
    height: 150,
    transform: [{ translateY: -20 }],
  },
  offlineBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.warningOrange,
    borderRadius: 8,
  },
  offlineText: { color: colors.primaryNavy, fontWeight: "600", fontSize: 13 },
  welcomeCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  welcomeTitle: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  welcomeSub: { marginTop: 8, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  signedInMeta: { marginTop: 12, fontSize: 14, color: colors.textPrimary, fontWeight: "600" },
  countMeta: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  inlineLoader: { marginTop: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryNavy,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  qaRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  qaCard: {
    flex: 1,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    padding: 14,
    minHeight: 88,
    justifyContent: "center",
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  qaTitle: { fontSize: 15, fontWeight: "700", color: colors.primaryNavy },
  qaSub: { marginTop: 6, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  recentLoading: { padding: 24, alignItems: "center" },
  emptyCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.primaryNavy },
  emptySub: { marginTop: 8, textAlign: "center", color: colors.textSecondary, lineHeight: 20 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: colors.primaryGold,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyBtnText: { color: colors.primaryNavy, fontWeight: "700" },
  recentCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
  },
  recentTitle: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy },
  recentSub: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  apptCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGold,
  },
  apptKind: { fontSize: 12, fontWeight: "700", color: colors.primaryNavy, marginBottom: 4 },
  muted: { paddingHorizontal: 16, color: colors.textSecondary, marginBottom: 12 },
  hubRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.cleanWhite,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  hubRowText: { fontSize: 17, color: colors.primaryNavy, fontWeight: "500" },
  chev: { fontSize: 22, color: colors.textLight },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 12,
  },
  footerWrap: { paddingVertical: 8, paddingHorizontal: 4 },
  footer: { color: colors.primaryNavy, textDecorationLine: "underline", fontSize: 14 },
  footerSep: { color: colors.textSecondary, fontSize: 14 },
});
