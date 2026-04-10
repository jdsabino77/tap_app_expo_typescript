import { HeaderBackButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useCallback } from "react";
import { colors } from "../theme/tokens";

const HEADER_TINT = colors.primaryNavy;

function parentThatCanGoBack(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<ParamListBase> | undefined {
  let current: NavigationProp<ParamListBase> | undefined = navigation.getParent() ?? undefined;
  while (current) {
    if (current.canGoBack()) {
      return current;
    }
    current = current.getParent() ?? undefined;
  }
  return undefined;
}

/**
 * Back for nested stacks: uses the child stack’s history when present; otherwise pops a parent
 * (e.g. dashboard → /treatments/new only mounts one nested route, so we pop the app stack).
 */
export function NestedStackExitBackButton() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const parentNav = parentThatCanGoBack(navigation);
  const canExit = navigation.canGoBack() || Boolean(parentNav);

  const onPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    parentThatCanGoBack(navigation)?.goBack();
  }, [navigation]);

  if (!canExit) {
    return null;
  }

  return <HeaderBackButton tintColor={HEADER_TINT} onPress={onPress} />;
}
