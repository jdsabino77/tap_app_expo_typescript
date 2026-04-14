import { Image, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
/** Double-tap zoom when at 1× (helps iOS Simulator where pinch is awkward). */
const DOUBLE_TAP_ZOOM = 2.2;

type ZoomableImageProps = {
  uri: string;
  width: number;
  height: number;
  /** `cover` fills the frame (uniform tiles); `contain` shows full image with possible letterboxing. */
  resizeMode?: "contain" | "cover";
};

/**
 * Pinch-to-zoom and pan when zoomed.
 *
 * **Physical device:** use a two-finger pinch in or out on the image.
 *
 * **iOS Simulator:** pinch is not a real trackpad gesture — hold **⌥ (Option)** until two
 * touch circles appear, then drag to pinch. Alternatively **double-tap** the image to
 * zoom in, double-tap again to reset (works everywhere).
 *
 * Pan uses `maxPointers(1)` so it does not compete with the two-finger pinch gesture.
 */
export function ZoomableImage({
  uri,
  width,
  height,
  resizeMode = "contain",
}: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const pinchBase = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panOriginX = useSharedValue(0);
  const panOriginY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchBase.value = savedScale.value;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchBase.value * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      panOriginX.value = translateX.value;
      panOriginY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1.01) {
        return;
      }
      translateX.value = panOriginX.value + e.translationX;
      translateY.value = panOriginY.value + e.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value <= 1.01) {
        scale.value = DOUBLE_TAP_ZOOM;
        savedScale.value = DOUBLE_TAP_ZOOM;
        pinchBase.value = DOUBLE_TAP_ZOOM;
      } else {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        pinchBase.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.clip, { width, height }]}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.fill, animatedStyle]}>
          <Image source={{ uri }} style={styles.fill} resizeMode={resizeMode} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  fill: { width: "100%", height: "100%" },
});
