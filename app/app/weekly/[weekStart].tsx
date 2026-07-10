import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApi } from '@/hooks/use-api';
import { formatWeekRange } from '@/utils/dateFormatters';

interface WeeklySummary {
  id: string;
  week_start: string;
  week_end: string;
  summary_text: string;
  reflection_count: number;
}

export default function WeeklySummaryViewer() {
  const { weekStart } = useLocalSearchParams<{ weekStart: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  const { get } = useApi();
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular });
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!weekStart) return;
    fetchSummary();
  }, [weekStart]);

  const fetchSummary = async () => {
    try {
      const data = await get<WeeklySummary>(`/practice/weekly-summary/${weekStart}`);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const range = formatWeekRange(summary.week_start, summary.week_end);
    const message = [
      `My Weekly Mirror — ${range}`,
      '',
      summary.summary_text,
    ].join('\n');

    await Share.share({ message });
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

  if (!summary) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
        <View style={[styles.header, { borderBottomColor: palette.border.light }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color={palette.text.muted} />
          <Text style={[styles.emptyText, { color: palette.text.secondary }]}>Summary not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: palette.border.light }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text.secondary }]}>
          {formatWeekRange(summary.week_start, summary.week_end)}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={palette.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: palette.background.secondary, borderColor: palette.accent.muted }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: palette.accent.primary }]}>YOUR WEEKLY MIRROR</Text>
            <Text style={[styles.reflectionCount, { color: palette.text.muted }]}>
              {summary.reflection_count} {summary.reflection_count === 1 ? 'reflection' : 'reflections'}
            </Text>
          </View>
          <Text style={[styles.summaryText, { color: palette.text.primary }]}>
            {summary.summary_text}
          </Text>
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

  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },

  container: {
    flex: 1,
  },

  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: WarmPalette.accent.muted,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  cardLabel: {
    ...Typography.sectionHeader,
    color: WarmPalette.accent.primary,
  },

  reflectionCount: {
    ...Typography.caption,
    color: WarmPalette.text.muted,
  },

  summaryText: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    lineHeight: 32,
    color: WarmPalette.text.primary,
    fontStyle: 'italic',
  },
});
