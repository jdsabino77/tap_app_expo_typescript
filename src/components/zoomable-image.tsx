import { Image, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

type ZoomableImageProps = {
  uri: string;
  width: number;
  height: number;
};

/**
 * Pinch-to-zoom and pan when zoomed; double-tap resets. For use inside a bounded cell (e.g. compare grid).
 */
export function ZoomableImage({ uri, width, height }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const pinchBase = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
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
    })
    .onEnd(() => {
      savedTx.value = translateX.value;
      savedTy.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(MIN_SCALE);
      savedScale.value = MIN_SCALE;
      pinchBase.value = MIN_SCALE;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTx.value = 0;
      savedTy.value = 0;
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
          <Image source={{ uri }} style={styles.fill} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  fill: { width: "100%", height: "100%" },
});
