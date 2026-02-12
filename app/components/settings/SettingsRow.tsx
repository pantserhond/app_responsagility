import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WarmPalette, DarkWarmPalette, Spacing, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface SettingsRowProps {
  label: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'value';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  showBorder?: boolean;
  theme?: AppTheme;
}

export default function SettingsRow({
  label,
  subtitle,
  type,
  value,
  onPress,
  onToggle,
  showBorder = true,
  theme = 'light',
}: SettingsRowProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  const renderRight = () => {
    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={value as boolean}
            onValueChange={onToggle}
            trackColor={{
              false: palette.border.medium,
              true: palette.accent.muted,
            }}
            thumbColor={value ? palette.accent.primary : palette.background.secondary}
            ios_backgroundColor={palette.border.medium}
          />
        );
      case 'navigation':
        return (
          <View style={styles.navRight}>
            {value && <Text style={[styles.valueText, { color: palette.text.secondary }]}>{value}</Text>}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={palette.text.muted}
            />
          </View>
        );
      case 'value':
        return <Text style={[styles.valueText, { color: palette.text.secondary }]}>{value}</Text>;
      default:
        return null;
    }
  };

  const content = (
    <View style={[styles.container, showBorder && [styles.border, { borderBottomColor: palette.border.light }]]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: palette.text.primary }]}>{label}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: palette.text.secondary }]}>{subtitle}</Text>}
      </View>
      {renderRight()}
    </View>
  );

  if (type === 'navigation' && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },

  border: {
    borderBottomWidth: 1,
    borderBottomColor: WarmPalette.border.light,
  },

  labelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },

  label: {
    ...Typography.body,
    color: WarmPalette.text.primary,
  },

  subtitle: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginTop: 2,
  },

  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  valueText: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
  },
});
