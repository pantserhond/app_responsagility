import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';
import type { Answers, ReflectionStep } from './PracticeTileContainer';

interface ReviewOverlayProps {
  visible: boolean;
  answers: Answers;
  isGenerating: boolean;
  onEdit: (step: ReflectionStep, newAnswer: string) => void;
  onConfirm: () => void;
  theme?: AppTheme;
}

const QUESTIONS: Record<ReflectionStep, string> = {
  react: 'How did you react to a challenging moment today?',
  respond: 'How would you have liked to respond instead?',
  notice: 'What did you notice about yourself in that moment?',
  learn: 'What will you take forward from this reflection?',
};

const STEP_ORDER: ReflectionStep[] = ['react', 'respond', 'notice', 'learn'];

export default function ReviewOverlay({
  visible,
  answers,
  isGenerating,
  onEdit,
  onConfirm,
  theme = 'light',
}: ReviewOverlayProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const [editingStep, setEditingStep] = useState<ReflectionStep | null>(null);
  const [editValue, setEditValue] = useState('');

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    } else {
      overlayOpacity.value = 0;
      contentOpacity.value = 0;
      setEditingStep(null);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleStartEdit = (step: ReflectionStep) => {
    setEditingStep(step);
    setEditValue(answers[step]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveEdit = () => {
    if (editingStep) {
      onEdit(editingStep, editValue.trim());
      setEditingStep(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCancelEdit = () => {
    setEditingStep(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle, { backgroundColor: palette.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.container, contentStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text.primary }]}>
              Review Your Reflection
            </Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
              Make any changes before your mirror is created
            </Text>
          </View>

          {/* Answers list */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {STEP_ORDER.map((step, index) => (
              <View
                key={step}
                style={[styles.answerCard, { backgroundColor: palette.background.secondary }]}
              >
                <View style={styles.answerHeader}>
                  <Text style={[styles.stepNumber, { color: palette.text.muted }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.question, { color: palette.text.primary }]} numberOfLines={2}>
                    {QUESTIONS[step]}
                  </Text>
                </View>

                {editingStep === step ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={[
                        styles.editInput,
                        {
                          color: palette.text.primary,
                          backgroundColor: palette.background.primary,
                          borderColor: palette.accent.primary,
                        },
                      ]}
                      value={editValue}
                      onChangeText={setEditValue}
                      multiline
                      autoFocus
                      placeholder="Your answer..."
                      placeholderTextColor={palette.text.muted}
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={[styles.editButton, { borderColor: palette.border.medium }]}
                        onPress={handleCancelEdit}
                      >
                        <Text style={[styles.editButtonText, { color: palette.text.secondary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, styles.saveButton, { backgroundColor: palette.accent.primary }]}
                        onPress={handleSaveEdit}
                      >
                        <Text style={[styles.editButtonText, { color: palette.text.inverse }]}>
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.answerContent}>
                    <Text style={[styles.answerText, { color: palette.text.primary }]}>
                      {answers[step]}
                    </Text>
                    <TouchableOpacity
                      style={styles.editIconButton}
                      onPress={() => handleStartEdit(step)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil" size={16} color={palette.text.muted} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Confirm button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: palette.accent.primary },
                isGenerating && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isGenerating || editingStep !== null}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color={palette.text.inverse} />
                  <Text style={[styles.confirmButtonText, { color: palette.text.inverse, marginLeft: 8 }]}>
                    Creating Your Mirror...
                  </Text>
                </>
              ) : (
                <Text style={[styles.confirmButtonText, { color: palette.text.inverse }]}>
                  Looks Good, Create Mirror
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },

  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 28,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    ...Typography.body,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  answerCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  answerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.sm,
    marginTop: 2,
  },

  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  answerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  answerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: Spacing.lg,
  },

  editIconButton: {
    padding: Spacing.xs,
    opacity: 0.6,
  },

  editContainer: {
    paddingLeft: Spacing.lg,
  },

  editInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },

  editButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  saveButton: {
    borderWidth: 0,
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },

  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },

  buttonDisabled: {
    opacity: 0.8,
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
