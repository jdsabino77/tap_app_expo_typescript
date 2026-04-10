import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import type { Treatment } from "../../../src/domain/treatment";
import { formatDisplayDateTime } from "../../../src/lib/datetime";
import { formatCurrency } from "../../../src/lib/format";
import { isWriteQueuedError } from "../../../src/lib/write-queued-error";
import {
  deleteTreatmentForCurrentUser,
  fetchTreatmentById,
  fetchTreatmentPhotoSignedUrls,
} from "../../../src/repositories/treatment.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function TreatmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const [row, setRow] = useState<Treatment | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!supabaseEnabled || !id) {
      setRow(null);
      return;
    }
    setError(null);
    try {
      const t = await fetchTreatmentById(id);
      setRow(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRow(null);
    }
  }, [id, supabaseEnabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!row?.photoUrls?.length) {
      setPhotoUrls([]);
      return;
    }
    let cancelled = false;
    void fetchTreatmentPhotoSignedUrls(row.photoUrls).then((urls) => {
      if (!cancelled) {
        setPhotoUrls(urls);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [row?.photoUrls]);

  const onDelete = () => {
    if (!id) {
      return;
    }
    Alert.alert(
      "Delete treatment",
      "This cannot be undone. Your logged treatment count will go down by one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDeleting(true);
            void deleteTreatmentForCurrentUser(id)
              .then(() => {
                router.back();
              })
              .catch((e) => {
                if (isWriteQueuedError(e)) {
                  Alert.alert("Queued for sync", e.message, [{ text: "OK", onPress: () => router.back() }]);
                  return;
                }
                Alert.alert("Could not delete", e instanceof Error ? e.message : "Error");
              })
              .finally(() => {
                setDeleting(false);
              });
          },
        },
      ],
    );
  };

  if (!supabaseEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.p}>Treatment id: {id}</Text>
        <Text style={styles.muted}>Enable Supabase to load detail from the database.</Text>
      </View>
    );
  }

  if (row === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }

  if (!row) {
    return (
      <View style={styles.container}>
        <Text style={styles.p}>Treatment not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>
        {row.treatmentType} · {row.serviceType}
      </Text>
      <Text style={styles.line}>{formatDisplayDateTime(row.treatmentDate)}</Text>
      <Text style={styles.line}>Brand: {row.brand || "—"}</Text>
      {row.treatmentType === "injectable" ? (
        <Text style={styles.line}>Units: {row.units}</Text>
      ) : null}
      <Text style={styles.line}>Areas: {row.treatmentAreas.join(", ") || "—"}</Text>
      {row.cost != null ? (
        <Text style={styles.line}>Cost: {formatCurrency(Number(row.cost))}</Text>
      ) : null}
      {row.notes ? <Text style={styles.notes}>{row.notes}</Text> : null}

      {photoUrls.length ? (
        <>
          <Text style={styles.photosLabel}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
            {photoUrls.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={() => router.push(`/treatments/edit/${id}`)}>
          <Text style={styles.primaryBtnText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.dangerBtn, deleting && styles.disabled]}
          onPress={onDelete}
          disabled={deleting}
        >
          <Text style={styles.dangerBtnText}>{deleting ? "…" : "Delete"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, backgroundColor: colors.lightGray },
  container: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  title: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  line: { marginTop: 8, fontSize: 16, color: colors.textPrimary },
  notes: { marginTop: 16, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  photosLabel: { marginTop: 20, fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  photoStrip: { marginTop: 10, flexGrow: 0 },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: colors.borderSubtle,
  },
  p: { marginTop: 8, color: colors.textPrimary },
  muted: { marginTop: 8, color: colors.textSecondary },
  err: { color: colors.errorRed },
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
});
