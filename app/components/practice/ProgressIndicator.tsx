import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { WarmPalette, DarkWarmPalette, Spacing } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
  completedSteps: number;
  theme?: AppTheme;
}

function Dot({
  isActive,
  isCompleted,
  palette,
}: {
  isActive: boolean;
  isCompleted: boolean;
  palette: typeof WarmPalette;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(isActive ? 1.2 : 1, { damping: 15, stiffness: 200 });
    const backgroundColor = isCompleted
      ? palette.accent.primary
      : isActive
      ? palette.accent.secondary
      : palette.border.medium;

    return {
      transform: [{ scale }],
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function ProgressIndicator({
  totalSteps,
  currentStep,
  completedSteps,
  theme = 'light',
}: ProgressIndicatorProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Dot
          key={index}
          isActive={index === currentStep}
          isCompleted={index < completedSteps}
          palette={palette}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
