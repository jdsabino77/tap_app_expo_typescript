import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { Treatment } from "../../../src/domain/treatment";
import { formatDisplayDateTime } from "../../../src/lib/datetime";
import { formatCurrency } from "../../../src/lib/format";
import { fetchTreatmentById } from "../../../src/repositories/treatment.repository";
import { useSession } from "../../../src/store/session";
import { colors } from "../../../src/theme/tokens";

export default function TreatmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseEnabled } = useSession();
  const [row, setRow] = useState<Treatment | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseEnabled || !id) {
      setRow(null);
      return;
    }
    let cancelled = false;
    void fetchTreatmentById(id)
      .then((t) => {
        if (!cancelled) {
          setRow(t);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
          setRow(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, supabaseEnabled]);

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
    <View style={styles.container}>
      <Text style={styles.title}>
        {row.treatmentType} · {row.serviceType}
      </Text>
      <Text style={styles.line}>{formatDisplayDateTime(row.treatmentDate)}</Text>
      <Text style={styles.line}>Brand: {row.brand || "—"}</Text>
      <Text style={styles.line}>Units: {row.units}</Text>
      <Text style={styles.line}>Areas: {row.treatmentAreas.join(", ") || "—"}</Text>
      {row.cost != null ? (
        <Text style={styles.line}>Cost: {formatCurrency(Number(row.cost))}</Text>
      ) : null}
      {row.notes ? <Text style={styles.notes}>{row.notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.lightGray },
  title: { fontSize: 20, fontWeight: "700", color: colors.primaryNavy },
  line: { marginTop: 8, fontSize: 16, color: colors.textPrimary },
  notes: { marginTop: 16, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  p: { marginTop: 8, color: colors.textPrimary },
  muted: { marginTop: 8, color: colors.textSecondary },
  err: { color: colors.errorRed },
});
