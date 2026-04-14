import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { LaserType, ProviderServiceCatalogItem, TreatmentArea } from "../domain/reference-content";
import { toggleCommaListItem } from "../lib/catalog-text";
import { appStrings } from "../strings/appStrings";
import { colors } from "../theme/tokens";

const UNCATEGORIZED_KEY = "__other__";

function areaSortOrder(it: TreatmentArea): number {
  return it.order ?? 1_000_000;
}

function categoryBucketKey(category: string | undefined): string {
  const t = category?.trim() ?? "";
  return t === "" ? UNCATEGORIZED_KEY : t;
}

function categoryTitle(key: string): string {
  return key === UNCATEGORIZED_KEY ? appStrings.treatmentAreasCategoryOther : key;
}

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
    <TreatmentAreaGroupedChips items={items} selected={selected} onChangeSelected={onChangeSelected} />
  );
}

function TreatmentAreaGroupedChips({
  items,
  selected,
  onChangeSelected,
}: {
  items: TreatmentArea[];
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  const [filterText, setFilterText] = useState("");
  const query = filterText.trim().toLowerCase();

  const groupedSections = useMemo(() => {
    const filtered =
      query === ""
        ? items
        : items.filter((it) => it.name.trim().toLowerCase().includes(query));

    const byKey = new Map<string, TreatmentArea[]>();
    for (const it of filtered) {
      const key = categoryBucketKey(it.category);
      const list = byKey.get(key);
      if (list) {
        list.push(it);
      } else {
        byKey.set(key, [it]);
      }
    }

    const sections = [...byKey.entries()].map(([key, areas]) => {
      const sorted = [...areas].sort((a, b) => {
        const oa = areaSortOrder(a);
        const ob = areaSortOrder(b);
        if (oa !== ob) {
          return oa - ob;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
      const minOrder = sorted.reduce((m, a) => Math.min(m, areaSortOrder(a)), Number.POSITIVE_INFINITY);
      return { key, title: categoryTitle(key), areas: sorted, minOrder };
    });

    sections.sort((a, b) => {
      if (a.minOrder !== b.minOrder) {
        return a.minOrder - b.minOrder;
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });

    return sections;
  }, [items, query]);

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
      <Text style={styles.sublabel}>{appStrings.treatmentAreasSuggestionsLabel}</Text>
      <TextInput
        style={styles.searchInput}
        value={filterText}
        onChangeText={setFilterText}
        placeholder={appStrings.treatmentAreasSearchPlaceholder}
        placeholderTextColor={colors.textLight}
        accessibilityLabel={appStrings.treatmentAreasSearchAccessibilityLabel}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      {groupedSections.length === 0 ? (
        <Text style={styles.filterEmpty}>{appStrings.treatmentAreasFilterEmpty}</Text>
      ) : (
        groupedSections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
            <View style={styles.chipWrapRow}>
              {section.areas.map((it) => {
                const on = selected.some(
                  (s) => s.trim().toLowerCase() === it.name.trim().toLowerCase(),
                );
                return (
                  <Pressable
                    key={it.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={it.name}
                    style={[styles.chip, styles.chipWrap, on && styles.chipOn]}
                    onPress={() => toggle(it.name)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={2}>
                      {it.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
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
  searchInput: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  filterEmpty: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  chipWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
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
  chipWrap: {
    marginBottom: 8,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { color: colors.textPrimary, fontSize: 13, fontWeight: "500" },
  chipTextOn: { color: colors.primaryNavy },
  loader: { marginVertical: 8 },
  warn: { color: colors.warningOrange, fontSize: 13, marginBottom: 6, fontWeight: "600" },
});
