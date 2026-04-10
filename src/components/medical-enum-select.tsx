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

type Props = {
  /** Shown in the modal header (usually matches the field label above the trigger). */
  sheetTitle: string;
  value: string;
  options: readonly string[];
  formatOption: (value: string) => string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * Bottom-sheet style chooser — reads like a dropdown and works on iOS, Android, and web.
 */
export function MedicalEnumSelect({
  sheetTitle,
  value,
  options,
  formatOption,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${sheetTitle}: ${formatOption(value)}. Opens list.`}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        disabled={disabled}
      >
        <Text style={styles.triggerText} numberOfLines={2}>
          {formatOption(value)}
        </Text>
        <Text style={styles.chev} accessibilityLabel="Open options">
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
              {options.map((opt) => {
                const selected = opt === value;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {formatOption(opt)}
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
