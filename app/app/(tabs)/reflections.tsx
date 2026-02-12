import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import MonthNavigator from '@/components/reflections/MonthNavigator';
import StreakDisplay from '@/components/reflections/StreakDisplay';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApi } from '@/hooks/use-api';

const DAYS_IN_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ReflectionsScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular });
  const theme = useAppTheme();
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const { get } = useApi();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompletedDates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await get<{ dates: string[] }>('/practice/reflections');
      setCompletedDates(data.dates ?? []);
    } catch {
      setCompletedDates([]);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  // Fetch completed dates when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchCompletedDates();
    }, [fetchCompletedDates])
  );

  // Calculate streak and stats
  const { currentStreak, totalReflections } = useMemo(() => {
    if (completedDates.length === 0) {
      return { currentStreak: 0, totalReflections: 0 };
    }

    // Sort dates in descending order
    const sortedDates = [...completedDates].sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];

    // Check if streak is active (completed today or yesterday)
    const mostRecent = sortedDates[0];
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
      return { currentStreak: 0, totalReflections: completedDates.length };
    }

    // Count consecutive days
    let checkDate = new Date(mostRecent);
    for (const dateStr of sortedDates) {
      const expectedStr = checkDate.toISOString().split('T')[0];
      if (dateStr === expectedStr) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return { currentStreak: streak, totalReflections: completedDates.length };
  }, [completedDates]);

  // Navigation
  const handlePreviousMonth = useCallback(() => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }, [year, month]);

  const canGoNext = useMemo(() => {
    return year < today.getFullYear() ||
      (year === today.getFullYear() && month < today.getMonth() + 1);
  }, [year, month]);

  // Calendar calculations
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const handleDayPress = useCallback((day: number) => {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (completedDates.includes(dateString)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/reflection/${dateString}`);
    }
  }, [year, month, completedDates, router]);

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text.primary }]}>Reflections</Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>Your journey of self-discovery</Text>
        </View>

        {/* Stats */}
        <StreakDisplay
          currentStreak={currentStreak}
          totalReflections={totalReflections}
          theme={theme}
        />

        {/* Month Navigator */}
        <MonthNavigator
          year={year}
          month={month}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
          canGoNext={canGoNext}
          theme={theme}
        />

        {/* Calendar */}
        <View style={[styles.calendar, { backgroundColor: palette.background.secondary }]}>
          {/* Week Header */}
          <View style={styles.weekHeader}>
            {DAYS_IN_WEEK.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={[styles.weekDayText, { color: palette.text.muted }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isCompleted = completedDates.includes(dateString);
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() + 1 &&
                year === today.getFullYear();
              const isFuture = new Date(dateString) > today;

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayCell}
                  onPress={() => handleDayPress(day)}
                  disabled={!isCompleted}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayBubble,
                      isCompleted && [styles.completedDayBubble, { backgroundColor: palette.accent.primary }],
                      isToday && !isCompleted && [styles.todayDayBubble, { borderColor: palette.accent.primary }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: palette.text.primary },
                        isFuture && { color: palette.text.muted },
                        isToday && !isCompleted && { color: palette.accent.primary },
                        isCompleted && [styles.completedDayText, { color: palette.text.inverse }],
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Empty state */}
        {totalReflections === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color={palette.accent.muted} />
            <Text style={[styles.emptyStateText, { color: palette.text.primary }]}>
              Your reflection journey begins today
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: palette.text.secondary }]}>
              Complete your first practice to see it here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const DAY_CELL_SIZE = 36;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WarmPalette.background.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
  },

  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  header: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 32,
    color: WarmPalette.text.primary,
  },

  subtitle: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
    marginTop: Spacing.xs,
  },

  calendar: {
    backgroundColor: WarmPalette.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },

  weekDayCell: {
    width: '14.28%',
    alignItems: 'center',
  },

  weekDayText: {
    ...Typography.caption,
    color: WarmPalette.text.muted,
    fontWeight: '600',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dayBubble: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    borderRadius: DAY_CELL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dayText: {
    fontSize: 16,
    color: WarmPalette.text.primary,
  },

  completedDayBubble: {
    backgroundColor: WarmPalette.accent.primary,
  },

  completedDayText: {
    color: WarmPalette.text.inverse,
    fontWeight: '600',
  },

  todayDayBubble: {
    borderWidth: 2,
    borderColor: WarmPalette.accent.primary,
  },

  todayText: {
    color: WarmPalette.accent.primary,
    fontWeight: '600',
  },

  futureDayText: {
    color: WarmPalette.text.muted,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },

  emptyStateText: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 18,
    color: WarmPalette.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  emptyStateSubtext: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
