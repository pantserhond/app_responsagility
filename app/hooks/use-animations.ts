import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

/**
 * Animation for card entrance with scale and fade.
 */
export function useCardAnimation() {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animateIn = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);

  const animateOut = useCallback((onComplete?: () => void) => {
    scale.value = withTiming(0.95, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      if (onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, []);

  const reset = useCallback(() => {
    scale.value = 0.95;
    opacity.value = 0;
  }, []);

  return { animatedStyle, animateIn, animateOut, reset };
}

/**
 * Animation for button press with subtle scale.
 */
export function usePressAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 100 });
    opacity.value = withTiming(0.8, { duration: 100 });
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  }, []);

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Animation for progress dots with pulse effect.
 */
export function useProgressDotAnimation(isActive: boolean) {
  const scale = useSharedValue(isActive ? 1 : 0.7);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.7, 1], [0.5, 1]),
  }));

  const setActive = useCallback((active: boolean) => {
    scale.value = withSpring(active ? 1 : 0.7, { damping: 12, stiffness: 200 });
  }, []);

  return { animatedStyle, setActive };
}

/**
 * Animation for fade transitions.
 */
export function useFadeAnimation(initialVisible = false) {
  const opacity = useSharedValue(initialVisible ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fadeIn = useCallback((duration = 300) => {
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
  }, []);

  const fadeOut = useCallback((duration = 300, onComplete?: () => void) => {
    opacity.value = withTiming(0, { duration, easing: Easing.in(Easing.ease) }, () => {
      if (onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, []);

  return { animatedStyle, fadeIn, fadeOut, opacity };
}

/**
 * Animation for slide up entrance (used for mirror reveal).
 */
export function useSlideUpAnimation() {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const slideIn = useCallback((delay = 0) => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const reset = useCallback(() => {
    translateY.value = 20;
    opacity.value = 0;
  }, []);

  return { animatedStyle, slideIn, reset };
}

/**
 * Animation for checkmark celebration.
 */
export function useCheckmarkAnimation() {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-45);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animate = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    rotation.value = withSpring(0, { damping: 12, stiffness: 150 });
  }, []);

  const reset = useCallback(() => {
    scale.value = 0;
    rotation.value = -45;
  }, []);

  return { animatedStyle, animate, reset };
}
