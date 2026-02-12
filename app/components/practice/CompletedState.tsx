import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useCheckmarkAnimation, useFadeAnimation } from '@/hooks/use-animations';
import type { AppTheme } from '@/hooks/use-app-theme';

interface CompletedStateProps {
  onNavigate: () => void;
  theme?: AppTheme;
}

export default function CompletedState({ onNavigate, theme = 'light' }: CompletedStateProps) {
  const { animatedStyle: checkStyle, animate: animateCheck } = useCheckmarkAnimation();
  const { animatedStyle: fadeStyle, fadeIn } = useFadeAnimation();

  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  useEffect(() => {
    // Start animations
    animateCheck();
    fadeIn(500);
  }, []);

  const handleViewReflection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigate();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
      <Animated.View style={[styles.iconContainer, checkStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: palette.accent.primary }]}>
          <Ionicons
            name="checkmark"
            size={48}
            color={palette.background.secondary}
          />
        </View>
      </Animated.View>

      <Animated.View style={fadeStyle}>
        <Text style={[styles.title, { color: palette.text.primary }]}>You've reflected today</Text>
        <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
          Take a moment to revisit your thoughts
        </Text>

        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: palette.accent.primary }]}
          onPress={handleViewReflection}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewButtonText, { color: palette.text.inverse }]}>
            View Today's Reflection
          </Text>
          <Ionicons name="arrow-forward" size={18} color={palette.text.inverse} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  iconContainer: {
    marginBottom: Spacing.xl,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },

  viewButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
