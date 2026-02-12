import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WarmPalette, DarkWarmPalette, Spacing, Typography } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/storage';
import type { AppTheme } from '@/hooks/use-app-theme';

interface NotificationSettingsProps {
  enabled: boolean;
  reminderTime: string;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  theme?: AppTheme;
}

export default function NotificationSettings({
  enabled,
  reminderTime,
  onToggle,
  onTimeChange,
  theme = 'light',
}: NotificationSettingsProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Parse time string to Date for the picker
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const timeDate = new Date();
  timeDate.setHours(hours, minutes, 0, 0);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);

    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive daily reminders.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  const scheduleNotification = async (time: string) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [h, m] = time.split(':').map(Number);

    // Schedule daily notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Reflection',
        body: 'Take a moment to reflect on your day.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      },
    });

    // Store the notification ID
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ID, identifier);
  };

  const cancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ID);
  };

  const handleToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }
      await scheduleNotification(reminderTime);
    } else {
      await cancelNotifications();
    }

    onToggle(value);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');

    if (selectedDate) {
      const newHours = selectedDate.getHours().toString().padStart(2, '0');
      const newMinutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${newHours}:${newMinutes}`;

      onTimeChange(newTime);

      // Reschedule if enabled
      if (enabled) {
        await scheduleNotification(newTime);
      }

      Haptics.selectionAsync();
    }
  };

  const formatTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={styles.container}>
      {/* Enable Toggle */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: palette.text.primary }]}>Daily Reminder</Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
            Get a gentle nudge to reflect each day
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{
            false: palette.border.medium,
            true: palette.accent.muted,
          }}
          thumbColor={enabled ? palette.accent.primary : palette.background.secondary}
          ios_backgroundColor={palette.border.medium}
        />
      </View>

      {/* Time Picker */}
      {enabled && (
        <View style={[styles.row, styles.timeRow, { borderTopColor: palette.border.light }]}>
          <Text style={[styles.label, { color: palette.text.primary }]}>Reminder Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, { backgroundColor: palette.background.primary, borderColor: palette.border.light }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.timeText, { color: palette.accent.primary }]}>{formatTime(reminderTime)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* iOS Time Picker Modal */}
      {showTimePicker && (
        <View style={[styles.pickerContainer, { backgroundColor: palette.background.tertiary }]}>
          <DateTimePicker
            value={timeDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            textColor={palette.text.primary}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.doneButton, { borderTopColor: palette.border.light }]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={[styles.doneButtonText, { color: palette.accent.primary }]}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: WarmPalette.border.light,
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

  timeButton: {
    backgroundColor: WarmPalette.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WarmPalette.border.light,
  },

  timeText: {
    ...Typography.body,
    color: WarmPalette.accent.primary,
    fontWeight: '500',
  },

  pickerContainer: {
    marginTop: Spacing.md,
    backgroundColor: WarmPalette.background.tertiary,
    borderRadius: 12,
    overflow: 'hidden',
  },

  doneButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: WarmPalette.border.light,
  },

  doneButtonText: {
    ...Typography.body,
    color: WarmPalette.accent.primary,
    fontWeight: '600',
  },
});
