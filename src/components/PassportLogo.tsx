import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

/** Visual parity with Flutter `lib/core/widgets/passport_logo.dart` (no raster asset). */
export function PassportLogo({ size = 80 }: { size?: number }) {
  const borderRadius = 12;
  const iconSize = size * 0.4;
  const tapFontSize = Math.max(10, size * 0.16);

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
      <Text style={[styles.tap, { fontSize: tapFontSize, bottom: size * 0.1 }]}>T.A.P</Text>
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 6,
    overflow: "hidden",
  },
  lineTop: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.35)",
  },
  iconCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  tap: {
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
    backgroundColor: "rgba(212, 175, 55, 0.35)",
  },
});
