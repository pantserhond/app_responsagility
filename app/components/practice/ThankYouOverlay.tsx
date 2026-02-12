import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface ThankYouOverlayProps {
  visible: boolean;
  onContinue: () => void;
  theme?: AppTheme;
}

export default function ThankYouOverlay({
  visible,
  onContinue,
  theme = 'light',
}: ThankYouOverlayProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Sequence the animations for a gentle reveal
      overlayOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

      contentScale.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) }));
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

      iconScale.value = withDelay(300, withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 200 })
      ));

      textOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
      buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    } else {
      // Reset
      overlayOpacity.value = 0;
      contentScale.value = 0.9;
      contentOpacity.value = 0;
      iconScale.value = 0;
      textOpacity.value = 0;
      buttonOpacity.value = 0;
    }
  }, [visible]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle, { backgroundColor: palette.background.primary }]}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Decorative circle with icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.accent.muted }]}>
            <View style={[styles.iconInner, { backgroundColor: palette.accent.primary }]}>
              <Ionicons name="heart" size={32} color={palette.background.secondary} />
            </View>
          </View>
        </Animated.View>

        {/* Thank you message */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.title, { color: palette.text.primary }]}>
            Thank you
          </Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
            for taking time to reflect today
          </Text>
          <Text style={[styles.message, { color: palette.text.secondary }]}>
            Your thoughtfulness matters.{'\n'}
            Something special is being prepared for you.
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: palette.accent.primary },
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: palette.text.inverse }]}>
              Review Your Answers
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={palette.text.inverse}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Decorative elements */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1, { backgroundColor: palette.accent.muted }]} />
        <View style={[styles.decorativeCircle, styles.circle2, { backgroundColor: palette.accent.muted }]} />
        <View style={[styles.decorativeCircle, styles.circle3, { backgroundColor: palette.accent.muted }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 1,
  },

  iconContainer: {
    marginBottom: Spacing.xl,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 36,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    marginBottom: Spacing.lg,
  },

  message: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },

  buttonContainer: {
    alignItems: 'center',
  },

  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    minWidth: 200,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },

  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },

  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -40,
  },

  circle3: {
    width: 100,
    height: 100,
    bottom: -20,
    right: 50,
  },
});
