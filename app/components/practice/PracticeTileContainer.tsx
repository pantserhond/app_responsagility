import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette } from '@/constants/theme';
import ProgressIndicator from './ProgressIndicator';
import QuestionTile from './QuestionTile';
import MirrorTile from './MirrorTile';
import type { AppTheme } from '@/hooks/use-app-theme';

export type ReflectionStep = 'react' | 'respond' | 'notice' | 'learn';

export interface Answers {
  react: string;
  respond: string;
  notice: string;
  learn: string;
}

export const QUESTIONS: Record<ReflectionStep, string> = {
  react: 'Where did you react from your ego today?',
  respond: 'Instead of reacting, where did you manage to pause and respond today?',
  notice: 'What did you notice about yourself in moments of reaction and response today?',
  learn: 'What is one thing that you learned about yourself today?',
};

export const STEPS: ReflectionStep[] = ['react', 'respond', 'notice', 'learn'];

interface PracticeTileContainerProps {
  answers: Answers;
  draftAnswers: Answers;
  mirror: string | null;
  currentStep: number;
  editingStep: number | null;
  isLoading: boolean;
  onSubmitAnswer: (step: ReflectionStep, answer: string) => void;
  onDraftChange: (step: ReflectionStep, value: string) => void;
  onEditStep: (step: number) => void;
  onCancelEdit: () => void;
  onViewReflection: () => void;
  onPageChange: (page: number) => void;
  theme?: AppTheme;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PracticeTileContainer({
  answers,
  draftAnswers,
  mirror,
  currentStep,
  editingStep,
  isLoading,
  onSubmitAnswer,
  onDraftChange,
  onEditStep,
  onCancelEdit,
  onViewReflection,
  onPageChange,
  theme = 'light',
}: PracticeTileContainerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const hasMirror = mirror !== null && mirror.length > 0;
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  // Calculate completed steps (steps with answers)
  const completedSteps = STEPS.filter((step) => answers[step].trim().length > 0).length;

  // Scroll to current step when it changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: currentStep * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentStep]);

  // Determine how far the user can swipe
  // They can go back to any answered question, but can only go forward to the next unanswered
  const canSwipeTo = useCallback(
    (targetPage: number): boolean => {
      // Can always go back to answered questions
      if (targetPage < completedSteps) {
        return true;
      }
      // Can go to the current step (the one being answered)
      if (targetPage === completedSteps) {
        return true;
      }
      // Can go to mirror if all questions are answered
      if (hasMirror && targetPage === STEPS.length && completedSteps === STEPS.length) {
        return true;
      }
      return false;
    },
    [completedSteps, hasMirror]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newPage = Math.round(offsetX / SCREEN_WIDTH);

      // Only trigger page change if it's different and allowed
      const maxPage = STEPS.length - 1 + (hasMirror ? 1 : 0);
      if (newPage !== currentStep && newPage >= 0 && newPage <= maxPage) {
        if (canSwipeTo(newPage)) {
          Haptics.selectionAsync();
          onPageChange(newPage);
        } else {
          // Snap back to current step if trying to go too far forward
          scrollRef.current?.scrollTo({
            x: currentStep * SCREEN_WIDTH,
            animated: true,
          });
        }
      }
    },
    [currentStep, hasMirror, onPageChange, canSwipeTo]
  );

  const handleSubmit = useCallback(
    (step: ReflectionStep, answer: string) => {
      onSubmitAnswer(step, answer);
    },
    [onSubmitAnswer]
  );

  const handleEdit = useCallback(
    (stepIndex: number) => {
      onEditStep(stepIndex);
    },
    [onEditStep]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background.primary }]}>
      <ProgressIndicator
        totalSteps={STEPS.length}
        currentStep={Math.min(currentStep, STEPS.length - 1)}
        completedSteps={completedSteps}
        theme={theme}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isLoading}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {STEPS.map((step, index) => {
          const isLastStep = index === STEPS.length - 1;
          return (
            <View key={step} style={styles.page}>
              <QuestionTile
                question={QUESTIONS[step]}
                answer={answers[step]}
                draftAnswer={draftAnswers[step]}
                stepNumber={index + 1}
                totalSteps={STEPS.length}
                isActive={currentStep === index}
                isEditing={editingStep === index}
                isLoading={isLastStep && isLoading}
                onSubmit={(answer) => handleSubmit(step, answer)}
                onDraftChange={(value) => onDraftChange(step, value)}
                onEdit={() => handleEdit(index)}
                onCancelEdit={onCancelEdit}
                theme={theme}
              />
            </View>
          );
        })}

        {hasMirror && (
          <View key="mirror" style={styles.page}>
            <MirrorTile
              mirror={mirror!}
              isActive={currentStep === STEPS.length}
              onViewReflection={onViewReflection}
              theme={theme}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
