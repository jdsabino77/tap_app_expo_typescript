import { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import ImageViewing from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appStrings } from "../strings/appStrings";

const HIT_SLOP = { top: 16, left: 16, bottom: 16, right: 16 };

export type TreatmentPhotoViewerProps = {
  visible: boolean;
  uris: string[];
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
  onRequestClose: () => void;
};

/**
 * Full-screen gallery with pinch-to-zoom and horizontal paging.
 * Top-right ✕ + `useSafeAreaInsets()` — `SafeAreaView` inside a full-screen Modal often
 * reports no top inset on iOS, which collides with the status bar clock.
 * Patched `react-native-image-viewing` renders the list under the chrome so the close control receives taps.
 */
export function TreatmentPhotoViewer({
  visible,
  uris,
  imageIndex,
  onImageIndexChange,
  onRequestClose,
}: TreatmentPhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const images = useMemo(() => uris.map((uri) => ({ uri })), [uris]);

  const HeaderComponent = useCallback(
    (_props: { imageIndex: number }) => (
      <View style={[styles.headerBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appStrings.treatmentPhotoViewerCloseA11y}
          hitSlop={HIT_SLOP}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={onRequestClose}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
      </View>
    ),
    [onRequestClose, insets.top],
  );

  const FooterComponent = useCallback(
    ({ imageIndex: idx }: { imageIndex: number }) => (
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Text style={styles.counterText}>
          {appStrings.treatmentPhotoViewerCounter(idx + 1, uris.length)}
        </Text>
      </View>
    ),
    [uris.length, insets.bottom],
  );

  if (!uris.length) {
    return null;
  }

  const safeIndex = Math.min(Math.max(0, imageIndex), uris.length - 1);

  return (
    <ImageViewing
      key={`${width}x${height}`}
      images={images}
      imageIndex={safeIndex}
      visible={visible}
      onRequestClose={onRequestClose}
      onImageIndexChange={onImageIndexChange}
      presentationStyle="fullScreen"
      animationType="fade"
      doubleTapToZoomEnabled
      swipeToCloseEnabled
      HeaderComponent={HeaderComponent}
      FooterComponent={FooterComponent}
      keyExtractor={(_, index) => `treatment-photo-${index}`}
    />
  );
}

const styles = StyleSheet.create({
  headerBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00000077",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...(Platform.OS === "android" ? { elevation: 24 } : {}),
  },
  closeBtnPressed: {
    opacity: 0.8,
  },
  closeGlyph: {
    fontSize: 20,
    fontWeight: "500",
    color: "#FFF",
    lineHeight: 22,
    textAlign: "center",
  },
  footerBar: {
    width: "100%",
    alignItems: "center",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFFCC",
  },
});
