import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useEffect, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import { appStrings } from "../strings/appStrings";

const HIT_SLOP = { top: 12, left: 12, bottom: 12, right: 12 };

export type TreatmentPhotoViewerProps = {
  visible: boolean;
  uris: string[];
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
  onRequestClose: () => void;
};

/**
 * Full-screen gallery with pinch-to-zoom, horizontal paging, and temporary orientation unlock
 * while open (app default remains portrait via `app.config.js`).
 */
export function TreatmentPhotoViewer({
  visible,
  uris,
  imageIndex,
  onImageIndexChange,
  onRequestClose,
}: TreatmentPhotoViewerProps) {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS === "web" || !visible) {
      return;
    }
    void ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [visible]);

  const images = useMemo(() => uris.map((uri) => ({ uri })), [uris]);

  const HeaderComponent = useCallback(
    (_props: { imageIndex: number }) => (
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appStrings.treatmentPhotoViewerBackA11y}
          hitSlop={HIT_SLOP}
          style={styles.backBtn}
          onPress={onRequestClose}
        >
          <Text style={styles.backText}>‹ {appStrings.treatmentPhotoViewerBack}</Text>
        </Pressable>
      </SafeAreaView>
    ),
    [onRequestClose],
  );

  const FooterComponent = useCallback(
    ({ imageIndex: idx }: { imageIndex: number }) => (
      <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
        <Text style={styles.counterText}>
          {appStrings.treatmentPhotoViewerCounter(idx + 1, uris.length)}
        </Text>
      </SafeAreaView>
    ),
    [uris.length],
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
  headerSafe: {
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#00000077",
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFF",
  },
  footerSafe: {
    alignItems: "center",
    paddingBottom: 4,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFFCC",
  },
});
