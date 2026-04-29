import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { format, isValid, parseISO } from "date-fns";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../theme/tokens";

export type DateInputFieldProps = {
  valueYmd: string;
  onChangeYmd: (ymd: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  testID?: string;
  /** Merged with default field chrome (use screen `styles.input` for consistency). */
  inputStyle?: StyleProp<ViewStyle>;
};

function ymdToLocalDate(ymd: string): Date {
  const t = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return new Date();
  }
  const d = parseISO(t);
  return isValid(d) ? d : new Date();
}

function formatDisplay(ymd: string): string {
  const t = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return t.length > 0 ? t : "Select date";
  }
  const d = parseISO(t);
  if (!isValid(d)) {
    return "Select date";
  }
  return format(d, "MMM d, yyyy");
}

function WebDateInput({
  valueYmd,
  onChangeYmd,
  minimumDate,
  maximumDate,
  inputStyle,
  testID,
}: DateInputFieldProps) {
  const flat = StyleSheet.flatten([styles.input, inputStyle]) as Record<string, unknown>;
  const ymd = valueYmd.trim();
  const value = /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";

  return React.createElement("input", {
    type: "date",
    value,
    min: minimumDate ? format(minimumDate, "yyyy-MM-dd") : undefined,
    max: maximumDate ? format(maximumDate, "yyyy-MM-dd") : undefined,
    onChange: (e: { target: { value: string } }) => {
      const v = e.target.value;
      if (v) {
        onChangeYmd(v);
      }
    },
    style: {
      ...flat,
      width: "100%",
      boxSizing: "border-box",
    },
    ...(testID ? { "data-testid": testID } : {}),
  });
}

export function DateInputField(props: DateInputFieldProps) {
  const { valueYmd, onChangeYmd, minimumDate, maximumDate, testID, inputStyle } = props;
  const baseDate = useMemo(() => ymdToLocalDate(valueYmd), [valueYmd]);

  if (Platform.OS === "web") {
    return <WebDateInput {...props} />;
  }

  if (Platform.OS === "android") {
    const open = () => {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        display: "calendar",
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            onChangeYmd(format(date, "yyyy-MM-dd"));
          }
        },
      });
    };
    return (
      <Pressable
        style={[styles.input, inputStyle]}
        onPress={open}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={formatDisplay(valueYmd)}
      >
        <Text style={styles.inputText}>{formatDisplay(valueYmd)}</Text>
      </Pressable>
    );
  }

  return (
    <IOSDatePickerSheet
      baseDate={baseDate}
      valueYmd={valueYmd}
      onChangeYmd={onChangeYmd}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      inputStyle={inputStyle}
      testID={testID}
    />
  );
}

type IOSProps = {
  baseDate: Date;
  valueYmd: string;
  onChangeYmd: (ymd: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  inputStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

function IOSDatePickerSheet({
  baseDate,
  valueYmd,
  onChangeYmd,
  minimumDate,
  maximumDate,
  inputStyle,
  testID,
}: IOSProps) {
  const { width: windowWidth } = useWindowDimensions();
  /** Inline calendar draws left inside a wide native view; narrow + center the control. */
  const pickerWidth = Math.min(390, windowWidth - 32);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(baseDate);

  const onOpen = useCallback(() => {
    setWorking(baseDate);
    setOpen(true);
  }, [baseDate]);

  const onConfirm = useCallback(() => {
    onChangeYmd(format(working, "yyyy-MM-dd"));
    setOpen(false);
  }, [working, onChangeYmd]);

  return (
    <>
      <Pressable
        style={[styles.input, inputStyle]}
        onPress={onOpen}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={formatDisplay(valueYmd)}
      >
        <Text style={styles.inputText}>{formatDisplay(valueYmd)}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.scrimFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={styles.sheet}>
            <View style={styles.toolbar}>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.toolbarBtn}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} hitSlop={12}>
                <Text style={styles.toolbarBtnPrimary}>Done</Text>
              </Pressable>
            </View>
            {/*
              Inline UIDatePicker often lays out at 0 height inside RN Modal without explicit bounds
              (toolbar visible, calendar missing). Fixed size + theme matches white sheet.
            */}
            <View style={styles.pickerShell} collapsable={false}>
              <DateTimePicker
                value={working}
                mode="date"
                display="inline"
                themeVariant="light"
                style={[styles.iosInlinePicker, { width: pickerWidth }]}
                onChange={(_, d) => {
                  if (d) {
                    setWorking(d);
                  }
                }}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    minHeight: 48,
  },
  inputText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalRoot: {
    flex: 1,
  },
  scrimFill: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.overlayScrim,
  },
  sheet: {
    backgroundColor: colors.cleanWhite,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  toolbarBtn: {
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  toolbarBtnPrimary: {
    fontSize: 17,
    color: colors.primaryNavy,
    fontWeight: "700",
  },
  /** Inline calendar needs a concrete height; intrinsic size is often 0 inside Modal. */
  pickerShell: {
    width: "100%",
    minHeight: 380,
    alignItems: "center",
  },
  iosInlinePicker: {
    height: 380,
  },
});
