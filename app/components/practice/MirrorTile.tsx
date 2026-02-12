import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSlideUpAnimation, usePressAnimation } from '@/hooks/use-animations';
import type { AppTheme } from '@/hooks/use-app-theme';

interface MirrorTileProps {
  mirror: string;
  isActive: boolean;
  onViewReflection: () => void;
  theme?: AppTheme;
}

export default function MirrorTile({
  mirror,
  isActive,
  onViewReflection,
  theme = 'light',
}: MirrorTileProps) {
  const { animatedStyle: slideStyle, slideIn } = useSlideUpAnimation();
  const { animatedStyle: buttonStyle, onPressIn, onPressOut } = usePressAnimation();

  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  useEffect(() => {
    if (isActive) {
      slideIn();
    }
  }, [isActive]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewReflection();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: palette.accent.primary }]}>YOUR DAILY MIRROR</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={slideStyle}>
          <View style={[styles.mirrorContainer, {
            backgroundColor: palette.background.secondary,
            borderColor: palette.accent.muted,
          }]}>
            <View style={styles.quoteIcon}>
              <Ionicons
                name="sparkles"
                size={24}
                color={palette.accent.primary}
              />
            </View>

            <Text style={[styles.mirrorText, { color: palette.text.primary }]}>{mirror}</Text>
          </View>

          <View style={styles.completionMessage}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={palette.success}
            />
            <Text style={[styles.completionText, { color: palette.text.secondary }]}>
              Today's reflection is complete
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.accent.primary }]}
            onPress={handlePress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: palette.text.inverse }]}>View Full Reflection</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={palette.text.inverse}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  headerLabel: {
    ...Typography.sectionHeader,
    textAlign: 'center',
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  mirrorContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },

  quoteIcon: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  mirrorText: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    lineHeight: 32,
    fontStyle: 'italic',
  },

  completionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },

  completionText: {
    ...Typography.caption,
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  button: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
