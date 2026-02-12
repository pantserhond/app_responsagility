import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSlideUpAnimation, usePressAnimation } from '@/hooks/use-animations';
import type { AppTheme } from '@/hooks/use-app-theme';

interface QuestionTileProps {
  question: string;
  answer: string;
  draftAnswer: string;
  stepNumber: number;
  totalSteps: number;
  isActive: boolean;
  isEditing: boolean;
  isLoading?: boolean;
  onSubmit: (answer: string) => void;
  onDraftChange: (value: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  theme?: AppTheme;
}

const TYPING_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: 'system-ui',
  default: 'System',
});

const HOLD_DURATION = 3000; // 3 seconds

export default function QuestionTile({
  question,
  answer,
  draftAnswer,
  stepNumber,
  totalSteps,
  isActive,
  isEditing,
  isLoading = false,
  onSubmit,
  onDraftChange,
  onEdit,
  onCancelEdit,
  theme = 'light',
}: QuestionTileProps) {
  // Use draft answer if available, otherwise fall back to submitted answer
  const [inputValue, setInputValue] = useState(draftAnswer || answer);
  const [isHolding, setIsHolding] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { animatedStyle: slideStyle, slideIn } = useSlideUpAnimation();
  const { animatedStyle: buttonStyle, onPressIn, onPressOut } = usePressAnimation();

  // Animation values for hold-to-complete
  const holdProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const hasAnswer = answer.trim().length > 0;
  const canSubmit = inputValue.trim().length > 0 && !isLoading;
  const isLastStep = stepNumber === totalSteps;

  useEffect(() => {
    if (isActive) {
      slideIn();
    }
  }, [isActive]);

  // Sync inputValue when draft or answer changes externally
  useEffect(() => {
    setInputValue(draftAnswer || answer);
  }, [draftAnswer, answer]);

  // Handle text input changes - update local state and notify parent for auto-save
  const handleTextChange = useCallback((text: string) => {
    setInputValue(text);
    onDraftChange(text);
  }, [onDraftChange]);

  useEffect(() => {
    if (isEditing && isActive) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isEditing, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    };
  }, []);

  const triggerSubmit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
    onSubmit(inputValue.trim());
  }, [inputValue, onSubmit]);

  const handleHoldStart = useCallback(() => {
    if (!canSubmit || isLoading) return;

    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start progress animation
    holdProgress.value = withTiming(1, {
      duration: HOLD_DURATION,
      easing: Easing.linear,
    });

    // Start glow pulsing
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      true
    );

    // Start scale pulsing
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.02, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Haptic feedback during hold
    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 300);

    // Complete after hold duration
    holdTimeoutRef.current = setTimeout(() => {
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      runOnJS(triggerSubmit)();
    }, HOLD_DURATION);
  }, [canSubmit, isLoading, holdProgress, glowOpacity, pulseScale, triggerSubmit]);

  const handleHoldEnd = useCallback(() => {
    if (!isHolding) return;

    setIsHolding(false);

    // Cancel the timeout
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    // Stop haptic feedback
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }

    // Reset animations
    cancelAnimation(holdProgress);
    cancelAnimation(glowOpacity);
    cancelAnimation(pulseScale);

    holdProgress.value = withTiming(0, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    pulseScale.value = withTiming(1, { duration: 200 });
  }, [isHolding, holdProgress, glowOpacity, pulseScale]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onSubmit(inputValue.trim());
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  };

  // Animated styles for hold button
  const holdButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${holdProgress.value * 100}%`,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowSize = interpolate(holdProgress.value, [0, 1], [0, 8]);
    return {
      shadowOpacity: glowOpacity.value * 0.8,
      shadowRadius: glowSize + 4,
    };
  });

  // Read-only view when answered and not editing
  if (hasAnswer && !isEditing) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
        <View style={styles.header}>
          <Text style={[styles.stepLabel, { color: palette.text.muted }]}>
            Step {stepNumber} of {totalSteps}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={16} color={palette.text.muted} />
          </TouchableOpacity>
        </View>

        <Animated.View style={slideStyle}>
          <Text style={[styles.question, { color: palette.text.primary }]}>{question}</Text>

          <View style={[styles.answerContainer, {
            backgroundColor: palette.background.secondary,
            borderColor: palette.border.light,
          }]}>
            <Text style={[styles.answerText, { color: palette.text.primary }]}>{answer}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Input view when active or editing
  return (
    <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.stepLabel, { color: palette.text.muted }]}>
          Step {stepNumber} of {totalSteps}
        </Text>
        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.cancelText, { color: palette.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={slideStyle}>
        <Text style={[styles.question, { color: palette.text.primary }]}>{question}</Text>

        <View style={[styles.inputContainer, {
          backgroundColor: palette.background.secondary,
          borderColor: palette.accent.primary,
        }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: palette.text.primary }]}
            multiline
            placeholder="Take a moment to reflect..."
            placeholderTextColor={palette.text.muted}
            value={inputValue}
            onChangeText={handleTextChange}
          />
        </View>

        {/* Regular button for non-last steps and editing */}
        {(!isLastStep || isEditing) && (
          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: palette.accent.primary },
                !canSubmit && { backgroundColor: palette.border.medium },
              ]}
              onPress={handleSubmit}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText, { color: palette.text.inverse }]}>
                {isEditing ? 'Save' : 'Continue'}
              </Text>
              {!isEditing && (
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={palette.text.inverse}
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Hold-to-complete button for last step */}
        {isLastStep && !isEditing && (
          <View style={styles.holdButtonContainer}>
            {isLoading ? (
              <View
                style={[
                  styles.submitButton,
                  styles.holdButton,
                  { backgroundColor: palette.accent.primary },
                ]}
              >
                <ActivityIndicator size="small" color={palette.text.inverse} />
                <Text style={[styles.submitButtonText, { color: palette.text.inverse, marginLeft: 8 }]}>
                  Creating your mirror...
                </Text>
              </View>
            ) : (
              <Animated.View style={[holdButtonAnimatedStyle, glowStyle, {
                shadowColor: palette.accent.primary,
                shadowOffset: { width: 0, height: 0 },
              }]}>
                <Pressable
                  onPressIn={handleHoldStart}
                  onPressOut={handleHoldEnd}
                  disabled={!canSubmit}
                  style={[
                    styles.submitButton,
                    styles.holdButton,
                    { backgroundColor: palette.accent.primary },
                    !canSubmit && { backgroundColor: palette.border.medium },
                    isHolding && styles.holdButtonActive,
                  ]}
                >
                  {/* Progress bar overlay */}
                  <Animated.View
                    style={[
                      styles.progressBar,
                      progressBarStyle,
                      { backgroundColor: palette.accent.secondary },
                    ]}
                  />

                  {/* Button content */}
                  <View style={styles.holdButtonContent}>
                    <Text style={[styles.submitButtonText, { color: palette.text.inverse }]}>
                      {isHolding ? 'Keep holding...' : 'Hold to complete'}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {!isLoading && !isHolding && (
              <Text style={[styles.holdHint, { color: palette.text.muted }]}>
                Hold for 3 seconds to finish
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  stepLabel: {
    ...Typography.sectionHeader,
  },

  editButton: {
    padding: Spacing.xs,
    opacity: 0.6,
  },

  cancelButton: {
    padding: Spacing.xs,
  },

  cancelText: {
    ...Typography.caption,
  },

  question: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 26,
    lineHeight: 36,
    marginBottom: Spacing.xl,
  },

  answerContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
  },

  answerText: {
    fontFamily: TYPING_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 26,
  },

  inputContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },

  input: {
    fontFamily: TYPING_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 26,
    padding: Spacing.lg,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
  },

  submitButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  holdButtonContainer: {
    alignItems: 'center',
  },

  holdButton: {
    minWidth: 200,
    overflow: 'hidden',
    position: 'relative',
  },

  holdButtonActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  holdButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.full,
    opacity: 0.4,
  },

  holdHint: {
    ...Typography.caption,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
