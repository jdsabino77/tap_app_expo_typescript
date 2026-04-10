import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LaserType, ProviderServiceCatalogItem, TreatmentArea } from "../domain/reference-content";
import { toggleCommaListItem } from "../lib/catalog-text";
import { colors } from "../theme/tokens";

export function CatalogLoadState({ loading, error }: { loading: boolean; error: string | null }) {
  return (
    <View style={styles.loadWrap}>
      {loading ? <ActivityIndicator color={colors.primaryNavy} style={styles.loader} /> : null}
      {error ? <Text style={styles.warn}>{error}</Text> : null}
    </View>
  );
}

function SingleNameChips({
  label,
  items,
  current,
  onSelect,
}: {
  label: string;
  items: { id: string; name: string }[];
  current: string;
  onSelect: (name: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.block}>
      <Text style={styles.sublabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {items.map((it) => {
          const on = current.trim().toLowerCase() === it.name.trim().toLowerCase();
          return (
            <Pressable
              key={it.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onSelect(it.name)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {it.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CommaListChips({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: string; name: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  const tokens = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return (
    <View style={styles.block}>
      <Text style={styles.sublabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {items.map((it) => {
          const on = tokens.includes(it.name.trim().toLowerCase());
          return (
            <Pressable
              key={it.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onChange(toggleCommaListItem(value, it.name))}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {it.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function LaserBrandCatalogChips({
  items,
  current,
  onSelect,
}: {
  items: LaserType[];
  current: string;
  onSelect: (name: string) => void;
}) {
  return (
    <SingleNameChips label="Laser / device suggestions" items={items} current={current} onSelect={onSelect} />
  );
}

export function TreatmentAreaCatalogChips({
  items,
  selected,
  onChangeSelected,
}: {
  items: TreatmentArea[];
  /** Canonical area names currently chosen (catalog names or legacy DB values). */
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <CatalogMultiSelectChips
      label="Area suggestions (tap to add or remove)"
      items={items}
      selected={selected}
      onChangeSelected={onChangeSelected}
    />
  );
}

function CatalogMultiSelectChips({
  label,
  items,
  selected,
  onChangeSelected,
}: {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  const toggle = (rawName: string) => {
    const row = items.find((it) => it.name.trim().toLowerCase() === rawName.trim().toLowerCase());
    const canon = row?.name ?? rawName.trim();
    if (!canon) {
      return;
    }
    const idx = selected.findIndex((s) => s.trim().toLowerCase() === canon.toLowerCase());
    if (idx >= 0) {
      onChangeSelected(selected.filter((_, i) => i !== idx));
    } else {
      onChangeSelected([...selected, canon]);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={styles.sublabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
        {items.map((it) => {
          const on = selected.some(
            (s) => s.trim().toLowerCase() === it.name.trim().toLowerCase(),
          );
          return (
            <Pressable
              key={it.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => toggle(it.name)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {it.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ProviderSpecialtyCatalogChips({
  items,
  value,
  onChange,
}: {
  items: ProviderServiceCatalogItem[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <CommaListChips
      label="Specialty suggestions (tap to add or remove)"
      items={items}
      value={value}
      onChange={onChange}
    />
  );
}

const styles = StyleSheet.create({
  loadWrap: { marginBottom: 4 },
  block: { marginTop: 10 },
  sublabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  strip: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 8,
    maxWidth: 220,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { color: colors.textPrimary, fontSize: 13, fontWeight: "500" },
  chipTextOn: { color: colors.primaryNavy },
  loader: { marginVertical: 8 },
  warn: { color: colors.warningOrange, fontSize: 13, marginBottom: 6, fontWeight: "600" },
});
