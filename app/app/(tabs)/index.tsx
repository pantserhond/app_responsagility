import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import * as Haptics from 'expo-haptics';

import PracticeTileContainer, {
  Answers,
  ReflectionStep,
  STEPS,
} from '@/components/practice/PracticeTileContainer';
import CompletedState from '@/components/practice/CompletedState';
import ThankYouOverlay from '@/components/practice/ThankYouOverlay';
import ReviewOverlay from '@/components/practice/ReviewOverlay';
import ReadyPrompt from '@/components/practice/ReadyPrompt';
import { WarmPalette, DarkWarmPalette } from '@/constants/theme';
import { getPracticeKey, getTodayKey } from '@/constants/storage';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApi, API_BASE } from '@/hooks/use-api';

type ApiResponse =
  | { type: 'question'; text: string }
  | { type: 'mirror'; text: string }
  | { type: 'completed'; text: string };

interface PracticeData {
  answers: Answers;
  draftAnswers: Answers;
  currentStep: number;
  mirror: string | null;
  completed: boolean;
  isReady: boolean;
}

const initialAnswers: Answers = {
  react: '',
  respond: '',
  notice: '',
  learn: '',
};

export default function PracticeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular });
  const theme = useAppTheme();
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const { post, get } = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [draftAnswers, setDraftAnswers] = useState<Answers>(initialAnswers);
  const [currentStep, setCurrentStep] = useState(0);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [mirror, setMirror] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletedState, setShowCompletedState] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isGeneratingMirror, setIsGeneratingMirror] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const todayKey = getTodayKey();

  const resetTodayForTesting = async () => {
    try {
      await AsyncStorage.removeItem(getPracticeKey(todayKey));
      setAnswers(initialAnswers);
      setDraftAnswers(initialAnswers);
      setCurrentStep(0);
      setEditingStep(null);
      setMirror(null);
      setIsCompleted(false);
      setShowCompletedState(false);
      setShowThankYou(false);
      setShowReview(false);
      setIsGeneratingMirror(false);
      setIsReady(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  // Handle user ready to start reflection
  const handleReady = useCallback(() => {
    setIsReady(true);
    // State change will trigger save via useEffect
  }, []);

  // Handle user not ready - navigate to Reflections tab
  const handleNotNow = useCallback(() => {
    router.push('/reflections');
  }, [router]);

  // Handle draft changes (auto-save as user types)
  const handleDraftChange = useCallback((step: ReflectionStep, value: string) => {
    setDraftAnswers(prev => ({ ...prev, [step]: value }));
  }, []);

  // Load today's practice data
  useEffect(() => {
    loadPracticeData();
  }, []);

  // Persist practice data (including isReady and drafts)
  useEffect(() => {
    if (!isLoading) {
      savePracticeData();
    }
  }, [answers, draftAnswers, currentStep, mirror, isCompleted, isReady]);

  const loadPracticeData = async () => {
    try {
      const stored = await AsyncStorage.getItem(getPracticeKey(todayKey));
      if (stored) {
        const data: PracticeData = JSON.parse(stored);
        setAnswers(data.answers || initialAnswers);
        setDraftAnswers(data.draftAnswers || data.answers || initialAnswers);
        setCurrentStep(data.currentStep || 0);
        setMirror(data.mirror);
        setIsCompleted(data.completed || false);
        setIsReady(data.isReady || false);

        // If already completed, show the completed state
        if (data.completed && data.mirror) {
          setShowCompletedState(true);
        }
      }
    } catch (error) {
      console.error('Failed to load practice data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePracticeData = async () => {
    try {
      const data: PracticeData = {
        answers,
        draftAnswers,
        currentStep,
        mirror,
        completed: isCompleted,
        isReady,
      };
      await AsyncStorage.setItem(getPracticeKey(todayKey), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save practice data:', error);
    }
  };

  const handleSubmitAnswer = useCallback(
    async (step: ReflectionStep, answer: string) => {
      const stepIndex = STEPS.indexOf(step);
      const isEditing = editingStep !== null;
      const isLastQuestion = stepIndex === STEPS.length - 1; // 'learn' is the last question

      // Update local state immediately
      setAnswers((prev) => ({ ...prev, [step]: answer }));
      // Also update draft to match
      setDraftAnswers((prev) => ({ ...prev, [step]: answer }));

      // If editing, just cancel edit mode (don't sync to backend yet - wait for review)
      if (isEditing) {
        setEditingStep(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      // For questions 1-3: Advance to next question (don't sync to backend yet)
      if (!isLastQuestion) {
        const nextStep = stepIndex + 1;
        setCurrentStep(nextStep);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // Last question - show thank you overlay, then review screen
      setShowThankYou(true);
    },
    [editingStep]
  );

  // Handle continuing from thank you to review screen
  const handleThankYouContinue = useCallback(() => {
    setShowThankYou(false);
    setShowReview(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle editing an answer in the review screen
  const handleReviewEdit = useCallback((step: ReflectionStep, newAnswer: string) => {
    setAnswers((prev) => ({ ...prev, [step]: newAnswer }));
    setDraftAnswers((prev) => ({ ...prev, [step]: newAnswer }));
  }, []);

  // Handle confirming and submitting all answers from review screen
  const handleReviewConfirm = useCallback(async () => {
    setIsGeneratingMirror(true);

    try {
      // Submit all answers to the backend
      for (const step of STEPS) {
        await post('/practice/answer', {
          date: todayKey,
          userInput: answers[step],
        });
      }

      // The last answer should trigger mirror generation
      // Fetch the mirror
      const data = await get<{ mirror?: string }>(`/practice/reflection/${todayKey}`);

      if (data.mirror) {
        setMirror(data.mirror);
        setIsCompleted(true);
        setShowReview(false);
        setCurrentStep(STEPS.length); // Move to mirror tile
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Mirror not ready yet, might need to wait
        console.warn('Mirror not ready after submission');
        setMirror('Your reflection is being prepared...');
        setIsCompleted(true);
        setShowReview(false);
        setCurrentStep(STEPS.length);
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGeneratingMirror(false);
    }
  }, [answers, todayKey, post, get]);

  const handleEditStep = useCallback((stepIndex: number) => {
    setEditingStep(stepIndex);
    setCurrentStep(stepIndex);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingStep(null);
  }, []);

  const handleViewReflection = useCallback(() => {
    router.push(`/reflection/${todayKey}`);
  }, [router, todayKey]);

  const handlePageChange = useCallback((page: number) => {
    // Only allow navigating to completed steps or current step
    const completedStepsCount = STEPS.filter(
      (step) => answers[step].trim().length > 0
    ).length;

    // Allow viewing any completed step or the next step to answer
    if (page <= completedStepsCount || (mirror && page === STEPS.length)) {
      setCurrentStep(page);
    }
  }, [answers, mirror]);

  const handleCompletedNavigate = useCallback(() => {
    router.push(`/reflection/${todayKey}`);
  }, [router, todayKey]);

  // Show loading state
  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background.primary }]}>
        <ActivityIndicator size="large" color={palette.accent.primary} />
      </View>
    );
  }

  // Show completed celebration if already done today
  if (showCompletedState) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
        <CompletedState onNavigate={handleCompletedNavigate} theme={theme} />
        {__DEV__ && (
          <TouchableOpacity
            onPress={resetTodayForTesting}
            style={[styles.devButton, { backgroundColor: palette.text.muted }]}
          >
            <Text style={styles.devButtonText}>Reset day</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // Show ready prompt if user hasn't confirmed they're ready
  if (!isReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
        <ReadyPrompt
          onReady={handleReady}
          onNotNow={handleNotNow}
          theme={theme}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <PracticeTileContainer
          answers={answers}
          draftAnswers={draftAnswers}
          mirror={mirror}
          currentStep={currentStep}
          editingStep={editingStep}
          isLoading={isSending}
          onSubmitAnswer={handleSubmitAnswer}
          onDraftChange={handleDraftChange}
          onEditStep={handleEditStep}
          onCancelEdit={handleCancelEdit}
          onViewReflection={handleViewReflection}
          onPageChange={handlePageChange}
          theme={theme}
        />
      </KeyboardAvoidingView>

      {/* Thank You Overlay - shows after completing last question */}
      <ThankYouOverlay
        visible={showThankYou}
        onContinue={handleThankYouContinue}
        theme={theme}
      />

      {/* Review Overlay - shows after thank you, before mirror generation */}
      <ReviewOverlay
        visible={showReview}
        answers={answers}
        isGenerating={isGeneratingMirror}
        onEdit={handleReviewEdit}
        onConfirm={handleReviewConfirm}
        theme={theme}
      />

      {__DEV__ && !showThankYou && (
        <TouchableOpacity
          onPress={resetTodayForTesting}
          style={[styles.devButton, { backgroundColor: palette.text.muted }]}
        >
          <Text style={styles.devButtonText}>Reset day</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// Dev-only reset button component
function DevResetButton({ onReset }: { onReset: () => void }) {
  return (
    <TouchableOpacity
      style={styles.devButton}
      onPress={onReset}
    >
      <Text style={styles.devButtonText}>Reset</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
  },

  keyboardView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  devButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: WarmPalette.text.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    opacity: 0.6,
  },

  devButtonText: {
    color: '#fff',
    fontWeight: '500' as const,
    fontSize: 12,
  },
});
