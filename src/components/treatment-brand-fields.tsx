import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { LaserType, ServiceType, ServiceTypeBrand } from "../domain/reference-content";
import { brandsForServiceTypeName } from "../lib/treatment-brand-form";
import { appStrings } from "../strings/appStrings";
import { colors } from "../theme/tokens";
import { CatalogItemSelect } from "./catalog-item-select";

export type TreatmentBrandFieldsProps = {
  /** When true, brand UI uses `laserTypes` (device catalog); otherwise service-type brands. */
  useLaserDeviceBrandPicker: boolean;
  serviceTypeName: string;
  serviceTypes: ServiceType[];
  serviceTypeBrands: ServiceTypeBrand[];
  laserTypes: LaserType[];
  brandRowId: string;
  onBrandRowId: (id: string) => void;
  brandOtherDetail: string;
  onBrandOtherDetail: (s: string) => void;
};

export function TreatmentBrandFields({
  useLaserDeviceBrandPicker,
  serviceTypeName,
  serviceTypes,
  serviceTypeBrands,
  laserTypes,
  brandRowId,
  onBrandRowId,
  brandOtherDetail,
  onBrandOtherDetail,
}: TreatmentBrandFieldsProps) {
  const injectableOptions = useMemo(
    () => brandsForServiceTypeName(serviceTypeName, serviceTypes, serviceTypeBrands),
    [serviceTypeName, serviceTypes, serviceTypeBrands],
  );

  const pickerOptions = useMemo(
    () =>
      useLaserDeviceBrandPicker
        ? laserTypes.map((l) => ({ id: l.id, name: l.name }))
        : injectableOptions.map((b) => ({ id: b.id, name: b.name })),
    [useLaserDeviceBrandPicker, laserTypes, injectableOptions],
  );

  const selectedRow = useLaserDeviceBrandPicker
    ? laserTypes.find((l) => l.id === brandRowId)
    : injectableOptions.find((b) => b.id === brandRowId);
  const showOtherField = Boolean(selectedRow?.isOther);
  const showInjectableFallback = !useLaserDeviceBrandPicker && injectableOptions.length === 0;
  const showPicker = useLaserDeviceBrandPicker ? laserTypes.length > 0 : injectableOptions.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {useLaserDeviceBrandPicker
          ? appStrings.treatmentBrandLabelLaser
          : appStrings.treatmentBrandLabelInjectable}
      </Text>

      {showInjectableFallback ? (
        <Text style={styles.hint}>{appStrings.treatmentBrandNoCatalogListHint}</Text>
      ) : null}

      {showPicker ? (
        <CatalogItemSelect
          valueKey="id"
          sheetTitle={
            useLaserDeviceBrandPicker
              ? appStrings.treatmentBrandLaserTitle
              : appStrings.treatmentBrandInjectableTitle
          }
          value={brandRowId}
          options={pickerOptions}
          placeholder={appStrings.treatmentBrandPlaceholder}
          onChange={onBrandRowId}
          disabled={false}
        />
      ) : null}

      {showInjectableFallback ? (
        <TextInput
          style={styles.input}
          placeholder={appStrings.treatmentBrandOptionalPlaceholder}
          placeholderTextColor={colors.textLight}
          value={brandOtherDetail}
          onChangeText={onBrandOtherDetail}
        />
      ) : null}

      {showOtherField ? (
        <>
          <Text style={styles.fieldHint}>{appStrings.treatmentBrandOtherHint}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. specific neuromodulator or filler"
            placeholderTextColor={colors.textLight}
            value={brandOtherDetail}
            onChangeText={onBrandOtherDetail}
            autoCapitalize="sentences"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
