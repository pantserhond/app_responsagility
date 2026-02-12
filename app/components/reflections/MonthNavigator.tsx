import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  theme?: AppTheme;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MonthNavigator({
  year,
  month,
  onPrevious,
  onNext,
  canGoNext,
  theme = 'light',
}: MonthNavigatorProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  const handlePrevious = () => {
    Haptics.selectionAsync();
    onPrevious();
  };

  const handleNext = () => {
    if (canGoNext) {
      Haptics.selectionAsync();
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePrevious}
        activeOpacity={0.6}
      >
        <Ionicons name="chevron-back" size={24} color={palette.text.primary} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={[styles.month, { color: palette.text.primary }]}>{MONTH_NAMES[month - 1]}</Text>
        <Text style={[styles.year, { color: palette.text.secondary }]}>{year}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!canGoNext}
        activeOpacity={0.6}
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={canGoNext ? palette.text.primary : palette.text.muted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },

  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  buttonDisabled: {
    opacity: 0.3,
  },

  titleContainer: {
    alignItems: 'center',
  },

  month: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 24,
    color: WarmPalette.text.primary,
  },

  year: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
  },
});
