import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { TreatmentTypeCatalogRow } from "../domain/reference-content";
import { colors } from "../theme/tokens";

/** Up to 6 types → 2 rows × 3 columns; must match parent ScrollView horizontal padding. */
const COLUMNS = 3;
const GUTTER = 10;
const SCROLL_PAD_X = 16;
const CELL_MIN_HEIGHT = 56;

export type TreatmentTypeSelectGridProps = {
  types: TreatmentTypeCatalogRow[];
  selectedSlug: string;
  onSelectType: (slug: string) => void;
};

export function TreatmentTypeSelectGrid({
  types,
  selectedSlug,
  onSelectType,
}: TreatmentTypeSelectGridProps) {
  const { width: screenW } = useWindowDimensions();
  const inner = screenW - SCROLL_PAD_X * 2;
  const cellW = Math.max(0, Math.floor((inner - GUTTER * (COLUMNS - 1)) / COLUMNS));

  return (
    <View style={[styles.grid, { gap: GUTTER }]}>
      {types.map((t) => {
        const selected = selectedSlug === t.slug;
        return (
          <Pressable
            key={t.slug}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t.name}
            onPress={() => onSelectType(t.slug)}
            style={[
              styles.cell,
              { width: cellW, minHeight: CELL_MIN_HEIGHT },
              selected && styles.cellSelected,
            ]}
          >
            <Text style={[styles.cellLabel, selected && styles.cellLabelSelected]} numberOfLines={3}>
              {t.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cellSelected: {
    backgroundColor: colors.primaryGold,
    borderColor: colors.primaryGold,
  },
  cellLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 17,
    textAlign: "center",
  },
  cellLabelSelected: {
    color: colors.primaryNavy,
  },
});
