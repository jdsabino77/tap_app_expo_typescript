import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

/** Visual parity with Flutter `lib/core/widgets/passport_logo.dart` (no raster asset). */
export function PassportLogo({ size = 80 }: { size?: number }) {
  const borderRadius = 12;
  const iconSize = size * 0.4;
  const brandFontSize = Math.max(8, size * 0.13);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius,
          shadowRadius: Math.max(4, size * 0.1),
          shadowOffset: { width: 0, height: Math.max(2, size * 0.05) },
        },
      ]}
    >
      <View style={[styles.lineTop, { top: size * 0.15, left: size * 0.15, right: size * 0.15 }]} />
      <View
        style={[styles.lineTop, { top: size * 0.15 + size * 0.05 + 1, left: size * 0.15, right: size * 0.15 }]}
      />
      <View style={[styles.iconCenter, { paddingBottom: size * 0.1 }]}>
        <MaterialIcons name="medical-services" size={iconSize} color={colors.primaryGold} />
      </View>
      <Text style={[styles.brand, { fontSize: brandFontSize, bottom: size * 0.1 }]}>DermaPass</Text>
      <View style={[styles.lineBottom, { bottom: size * 0.05, left: size * 0.2, right: size * 0.2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: colors.primaryNavy,
    borderWidth: 2,
    borderColor: colors.primaryGold,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    elevation: 6,
    overflow: "hidden",
  },
  lineTop: {
    position: "absolute",
    height: 1,
    backgroundColor: colors.primaryGoldLineAccent,
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: colors.primaryGold,
    fontWeight: "700",
    letterSpacing: 2,
  },
  lineBottom: {
    position: "absolute",
    height: 1,
    backgroundColor: colors.primaryGoldLineAccent,
  },
});
