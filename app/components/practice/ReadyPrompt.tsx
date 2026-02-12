import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface ReadyPromptProps {
  onReady: () => void;
  onNotNow: () => void;
  theme?: AppTheme;
}

export default function ReadyPrompt({ onReady, onNotNow, theme = 'light' }: ReadyPromptProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  // Animation values
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animation
    iconOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    iconScale.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) }));

    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));

    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));

    buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const handleReady = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReady();
  };

  const handleNotNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotNow();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.accent.muted }]}>
            <Ionicons name="leaf" size={48} color={palette.accent.primary} />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { color: palette.text.primary }, titleStyle]}>
          Ready for your reflection?
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { color: palette.text.secondary }, subtitleStyle]}>
          Take a moment to pause and check in with yourself.
          {'\n'}This only takes a few minutes.
        </Animated.Text>

        <Animated.View style={[styles.buttons, buttonsStyle]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: palette.accent.primary }]}
            onPress={handleReady}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: palette.text.inverse }]}>
              Yes, I'm ready
            </Text>
            <Ionicons name="arrow-forward" size={18} color={palette.text.inverse} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: palette.border.medium }]}
            onPress={handleNotNow}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.text.secondary }]}>
              Not right now
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },

  content: {
    alignItems: 'center',
    maxWidth: 320,
  },

  iconContainer: {
    marginBottom: Spacing.xl,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },

  buttons: {
    width: '100%',
    gap: Spacing.md,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
