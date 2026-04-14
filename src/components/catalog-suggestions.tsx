import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  LaserType,
  ProviderServiceCatalogItem,
  TreatmentArea,
  TreatmentAreaRegion,
} from "../domain/reference-content";
import { toggleCommaListItem } from "../lib/catalog-text";
import { appStrings } from "../strings/appStrings";
import { colors } from "../theme/tokens";

const REGION_ORDER: TreatmentAreaRegion[] = ["head", "upper_body", "lower_body"];

function areaSortOrder(it: TreatmentArea): number {
  return it.order ?? 1_000_000;
}

function regionTitle(r: TreatmentAreaRegion): string {
  switch (r) {
    case "head":
      return appStrings.treatmentAreasRegionHead;
    case "upper_body":
      return appStrings.treatmentAreasRegionUpperBody;
    case "lower_body":
      return appStrings.treatmentAreasRegionLowerBody;
    default:
      return r;
  }
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

function selectedCountInRegion(
  region: TreatmentAreaRegion,
  catalog: TreatmentArea[],
  selected: string[],
): number {
  const inRegion = new Set(
    catalog.filter((it) => it.region === region).map((it) => it.name.trim().toLowerCase()),
  );
  return selected.filter((s) => inRegion.has(s.trim().toLowerCase())).length;
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
  const [expanded, setExpanded] = useState<Record<TreatmentAreaRegion, boolean>>({
    head: false,
    upper_body: false,
    lower_body: false,
  });

  const areasByRegion = useMemo(() => {
    const q = query;
    const result: Record<TreatmentAreaRegion, TreatmentArea[]> = {
      head: [],
      upper_body: [],
      lower_body: [],
    };
    for (const reg of REGION_ORDER) {
      const inReg = items.filter((it) => it.region === reg);
      const filtered =
        q === "" ? inReg : inReg.filter((it) => it.name.trim().toLowerCase().includes(q));
      result[reg] = [...filtered].sort((a, b) => {
        const oa = areaSortOrder(a);
        const ob = areaSortOrder(b);
        if (oa !== ob) {
          return oa - ob;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
    }
    return result;
  }, [items, query]);

  const anyVisible =
    areasByRegion.head.length +
      areasByRegion.upper_body.length +
      areasByRegion.lower_body.length >
    0;

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      const q = query.trim().toLowerCase();
      for (const reg of REGION_ORDER) {
        const inReg = items.filter((it) => it.region === reg);
        const vis =
          q === "" ? inReg : inReg.filter((it) => it.name.trim().toLowerCase().includes(q));
        const hasSel = selected.some((s) =>
          inReg.some((it) => it.name.trim().toLowerCase() === s.trim().toLowerCase()),
        );
        if (vis.length > 0 && q !== "") {
          next[reg] = true;
        }
        if (hasSel) {
          next[reg] = true;
        }
      }
      return next;
    });
  }, [items, selected, query]);

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

  const toggleRegion = (reg: TreatmentAreaRegion) => {
    setExpanded((p) => ({ ...p, [reg]: !p[reg] }));
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
      {!anyVisible && items.length > 0 ? (
        <Text style={styles.filterEmpty}>{appStrings.treatmentAreasFilterEmpty}</Text>
      ) : (
        REGION_ORDER.map((reg) => {
          const title = regionTitle(reg);
          const count = selectedCountInRegion(reg, items, selected);
          const suffix = appStrings.treatmentAreasRegionSelectedInRegion(count);
          const isOpen = expanded[reg];
          const chips = areasByRegion[reg];
          return (
            <View key={reg} style={styles.regionBlock}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${title}${suffix}`}
                accessibilityHint={appStrings.treatmentAreasRegionHeaderHint}
                onPress={() => toggleRegion(reg)}
                style={styles.regionHeader}
              >
                <Text style={styles.regionHeaderText}>
                  {isOpen ? "▾ " : "▸ "}
                  {title}
                  {suffix ? (
                    <Text style={styles.regionHeaderMeta}>{suffix}</Text>
                  ) : null}
                </Text>
              </Pressable>
              {isOpen ? (
                chips.length === 0 ? (
                  query ? (
                    <Text style={styles.regionEmpty}>{appStrings.treatmentAreasFilterEmpty}</Text>
                  ) : null
                ) : (
                  <View style={styles.chipWrapRow}>
                    {chips.map((it) => {
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
                )
              ) : null}
            </View>
          );
        })
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
  regionBlock: { marginBottom: 4 },
  regionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  regionHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  regionHeaderMeta: { fontWeight: "500", color: colors.textSecondary },
  regionEmpty: { fontSize: 13, color: colors.textSecondary, paddingVertical: 6, paddingLeft: 4 },
  chipWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 4,
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
