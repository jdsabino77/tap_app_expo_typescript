import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../theme/tokens";

export type CatalogOption = { id: string; name: string };

type Props = {
  sheetTitle: string;
  /** When `name`, value matches `option.name`. When `id`, value matches `option.id`. */
  valueKey?: "name" | "id";
  /** Selected name or id per `valueKey`, or "" when none. */
  value: string;
  options: readonly CatalogOption[];
  onChange: (next: string) => void;
  /** Shown in the trigger when `value` is empty. */
  placeholder: string;
  disabled?: boolean;
};

/**
 * Modal list picker for reference-catalog rows (service types, etc.).
 */
export function CatalogItemSelect({
  sheetTitle,
  valueKey = "name",
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const picked = value.trim();
  const selectedOpt =
    picked === ""
      ? undefined
      : valueKey === "id"
        ? options.find((o) => o.id === picked)
        : options.find((o) => o.name.toLowerCase() === picked.toLowerCase());

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${sheetTitle}: ${selectedOpt?.name || placeholder}`}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        disabled={disabled}
      >
        <Text
          style={[styles.triggerText, !selectedOpt && !picked && styles.triggerPlaceholder]}
          numberOfLines={2}
        >
          {selectedOpt?.name || placeholder}
        </Text>
        <Text style={styles.chev} accessibilityLabel="Open list">
          ▼
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdropStretch} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{sheetTitle}</Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.sheetScroll}
              bounces={false}
            >
              {options.length === 0 ? (
                <Text style={styles.empty}>No options available.</Text>
              ) : null}
              {options.map((opt) => {
                const selected =
                  valueKey === "id"
                    ? picked !== "" && opt.id === picked
                    : picked !== "" && opt.name.toLowerCase() === picked.toLowerCase();
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => {
                      onChange(valueKey === "id" ? opt.id : opt.name);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {opt.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.cancelRow} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  triggerDisabled: { opacity: 0.55 },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  triggerPlaceholder: { color: colors.textLight },
  chev: { fontSize: 12, color: colors.textSecondary },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: "flex-end",
  },
  backdropStretch: { flex: 1, width: "100%" },
  sheet: {
    backgroundColor: colors.cleanWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: "78%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetScroll: { maxHeight: 400 },
  empty: { padding: 20, textAlign: "center", color: colors.textSecondary, fontSize: 15 },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  optionRowSelected: { backgroundColor: colors.lightGray },
  optionText: { fontSize: 16, color: colors.textPrimary },
  optionTextSelected: { fontWeight: "600", color: colors.primaryNavy },
  cancelRow: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 8,
    borderTopColor: colors.lightGray,
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
});
