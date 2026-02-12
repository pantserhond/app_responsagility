import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  theme?: AppTheme;
}

export default function SettingsSection({ title, children, theme = 'light' }: SettingsSectionProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text.secondary }]}>{title}</Text>
      <View style={[styles.content, { backgroundColor: palette.background.secondary }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  title: {
    ...Typography.sectionHeader,
    color: WarmPalette.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  content: {
    backgroundColor: WarmPalette.background.secondary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
});
