import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface StreakDisplayProps {
  currentStreak: number;
  totalReflections: number;
  theme?: AppTheme;
}

export default function StreakDisplay({
  currentStreak,
  totalReflections,
  theme = 'light',
}: StreakDisplayProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  return (
    <View style={[styles.container, { backgroundColor: palette.background.secondary }]}>
      <View style={styles.statCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="flame" size={20} color={palette.warning} />
        </View>
        <Text style={[styles.statNumber, { color: palette.text.primary }]}>{currentStreak}</Text>
        <Text style={[styles.statLabel, { color: palette.text.secondary }]}>Day Streak</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border.light }]} />

      <View style={styles.statCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={20} color={palette.accent.primary} />
        </View>
        <Text style={[styles.statNumber, { color: palette.text.primary }]}>{totalReflections}</Text>
        <Text style={[styles.statLabel, { color: palette.text.secondary }]}>Reflections</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: WarmPalette.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
  },

  iconContainer: {
    marginBottom: Spacing.xs,
  },

  statNumber: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 28,
    color: WarmPalette.text.primary,
  },

  statLabel: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginTop: 2,
  },

  divider: {
    width: 1,
    backgroundColor: WarmPalette.border.light,
    marginHorizontal: Spacing.md,
  },
});
