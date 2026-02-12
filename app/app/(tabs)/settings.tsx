import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsRow from '@/components/settings/SettingsRow';
import CoachEmailForm from '@/components/settings/CoachEmailForm';
import NotificationSettings from '@/components/settings/NotificationSettings';

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    updateNotifications,
    updateCoach,
    updateProfile,
  } = useSettings();
  const { profile, signOut } = useAuth();

  const theme = useAppTheme();
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;

  const [showThemePicker, setShowThemePicker] = useState(false);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          },
        },
      ]
    );
  }, [signOut]);

  const handleThemeChange = useCallback(
    async (theme: Theme) => {
      Haptics.selectionAsync();
      await updateSettings({ theme });
      setShowThemePicker(false);
    },
    [updateSettings]
  );

  const handleCoachSave = useCallback(
    async (email: string | null, name: string | null) => {
      await updateCoach({ email, name });
    },
    [updateCoach]
  );

  const handleCoachShareToggle = useCallback(
    async (enabled: boolean) => {
      await updateCoach({ shareWeeklySummary: enabled });
    },
    [updateCoach]
  );

  const handleNotificationToggle = useCallback(
    async (enabled: boolean) => {
      await updateNotifications({ enabled, dailyReminderEnabled: enabled });
    },
    [updateNotifications]
  );

  const handleReminderTimeChange = useCallback(
    async (time: string) => {
      await updateNotifications({ dailyReminderTime: time });
    },
    [updateNotifications]
  );

  const formatMemberSince = (dateString: string | null): string => {
    if (!dateString) return 'Recently joined';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text.primary }]}>Settings</Text>
        </View>

        {/* Profile Section */}
        <SettingsSection title="Profile" theme={theme}>
          <View style={styles.profileCard}>
            <View style={[styles.profileIcon, { backgroundColor: palette.accent.muted }]}>
              <Ionicons name="person" size={28} color={palette.accent.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: palette.text.primary }]}>
                {settings.profile.displayName || profile?.fullName || 'Anonymous Reflector'}
              </Text>
              <Text style={[styles.profileDate, { color: palette.text.secondary }]}>
                Member since {formatMemberSince(settings.profile.startDate)}
              </Text>
            </View>
          </View>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" theme={theme}>
          <SettingsRow
            label="Theme"
            type="navigation"
            value={settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
            onPress={() => setShowThemePicker(!showThemePicker)}
            showBorder={!showThemePicker}
            theme={theme}
          />
          {showThemePicker && (
            <View style={[styles.themePicker, { borderTopColor: palette.border.light }]}>
              {THEME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    { borderBottomColor: palette.border.light },
                    settings.theme === option.value && { backgroundColor: palette.accent.muted },
                  ]}
                  onPress={() => handleThemeChange(option.value)}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: palette.text.primary },
                      settings.theme === option.value && { color: palette.accent.primary, fontWeight: '500' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {settings.theme === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={palette.accent.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" theme={theme}>
          <NotificationSettings
            enabled={settings.notifications.dailyReminderEnabled}
            reminderTime={settings.notifications.dailyReminderTime}
            onToggle={handleNotificationToggle}
            onTimeChange={handleReminderTimeChange}
            theme={theme}
          />
        </SettingsSection>

        {/* Coach Integration Section */}
        <SettingsSection title="Coach Integration" theme={theme}>
          <CoachEmailForm
            email={settings.coach.email}
            coachName={settings.coach.name}
            shareEnabled={settings.coach.shareWeeklySummary}
            onSave={handleCoachSave}
            onToggleShare={handleCoachShareToggle}
            theme={theme}
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="Account" theme={theme}>
          <SettingsRow
            label="Email"
            type="value"
            value={profile?.email ?? ''}
            theme={theme}
          />
          <SettingsRow
            label="Sign Out"
            type="navigation"
            onPress={handleLogout}
            showBorder={false}
            theme={theme}
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About" theme={theme}>
          <SettingsRow
            label="Version"
            type="value"
            value={appVersion}
            theme={theme}
          />
          <SettingsRow
            label="Privacy Policy"
            type="navigation"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: Add actual privacy policy URL
              Alert.alert('Privacy Policy', 'Privacy policy will be available soon.');
            }}
            theme={theme}
          />
          <SettingsRow
            label="Terms of Service"
            type="navigation"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: Add actual terms URL
              Alert.alert('Terms of Service', 'Terms of service will be available soon.');
            }}
            showBorder={false}
            theme={theme}
          />
        </SettingsSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.text.muted }]}>
            Made with care for your growth
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

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },

  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WarmPalette.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    ...Typography.body,
    color: WarmPalette.text.primary,
    fontWeight: '600',
    fontSize: 18,
  },

  profileDate: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginTop: 2,
  },

  themePicker: {
    borderTopWidth: 1,
    borderTopColor: WarmPalette.border.light,
  },

  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: WarmPalette.border.light,
  },

  themeOptionActive: {
    backgroundColor: WarmPalette.accent.muted,
  },

  themeOptionText: {
    ...Typography.body,
    color: WarmPalette.text.primary,
  },

  themeOptionTextActive: {
    color: WarmPalette.accent.primary,
    fontWeight: '500',
  },

  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  footerText: {
    ...Typography.caption,
    color: WarmPalette.text.muted,
    fontStyle: 'italic',
  },
});
