import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const API_BASE = 'http://192.168.110.202:3000';
const CLIENT_ID = 'test-user';

interface Reflection {
  react: string;
  respond: string;
  notice: string;
  learn: string;
  mirror: string;
}

const QUESTIONS = {
  react: 'Where did you react from your ego today?',
  respond: 'Instead of reacting, where did you manage to pause and respond today?',
  notice: 'What did you notice about yourself in moments of reaction and response today?',
  learn: 'What is one thing that you learned about yourself today?',
};

export default function DailyReflectionViewer() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  const [fontsLoaded] = useFonts({ EBGaramond_400Regular });
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!date) return;

    fetchReflection();
  }, [date]);

  const fetchReflection = async () => {
    try {
      const res = await fetch(`${API_BASE}/practice/reflection/${CLIENT_ID}/${date}`);
      const data = await res.json();
      setReflection(data);
    } catch {
      setReflection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background.primary }]}>
        <ActivityIndicator size="large" color={palette.accent.primary} />
      </View>
    );
  }

  if (!reflection) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
        <View style={[styles.header, { borderBottomColor: palette.border.light }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color={palette.text.muted} />
          <Text style={[styles.emptyText, { color: palette.text.secondary }]}>Reflection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.border.light }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.dateText, { color: palette.text.secondary }]}>{formatDate(date!)}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mirror Section */}
        <View style={[styles.mirrorSection, { backgroundColor: palette.background.secondary, borderColor: palette.accent.muted }]}>
          <View style={styles.mirrorHeader}>
            <Text style={[styles.mirrorLabel, { color: palette.accent.primary }]}>YOUR DAILY MIRROR</Text>
          </View>
          <Text style={[styles.mirrorText, { color: palette.text.primary }]}>{reflection.mirror}</Text>
        </View>

        {/* Responses Section */}
        <View style={styles.responsesSection}>
          <Text style={[styles.sectionLabel, { color: palette.text.secondary }]}>YOUR RESPONSES</Text>

          {Object.entries(QUESTIONS).map(([key, question]) => (
            <View key={key} style={[styles.responseCard, { backgroundColor: palette.background.secondary }]}>
              <Text style={[styles.questionText, { color: palette.text.secondary }]}>{question}</Text>
              <Text style={[styles.answerText, { color: palette.text.primary }]}>
                {reflection[key as keyof typeof QUESTIONS]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },

  emptyText: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: WarmPalette.border.light,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateText: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
    fontWeight: '500',
  },

  container: {
    flex: 1,
  },

  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  mirrorSection: {
    backgroundColor: WarmPalette.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: WarmPalette.accent.muted,
  },

  mirrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  mirrorLabel: {
    ...Typography.sectionHeader,
    color: WarmPalette.accent.primary,
  },

  mirrorText: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    lineHeight: 32,
    color: WarmPalette.text.primary,
    fontStyle: 'italic',
  },

  responsesSection: {
    gap: Spacing.md,
  },

  sectionLabel: {
    ...Typography.sectionHeader,
    color: WarmPalette.text.secondary,
    marginBottom: Spacing.sm,
  },

  responseCard: {
    backgroundColor: WarmPalette.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  questionText: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 16,
    color: WarmPalette.text.secondary,
    marginBottom: Spacing.sm,
  },

  answerText: {
    ...Typography.body,
    color: WarmPalette.text.primary,
    lineHeight: 24,
  },
});
