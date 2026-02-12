import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

export interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';

  // Notifications
  notifications: {
    enabled: boolean;
    dailyReminderEnabled: boolean;
    dailyReminderTime: string; // "HH:mm" format
  };

  // Coach Integration
  coach: {
    email: string | null;
    name: string | null;
    shareWeeklySummary: boolean;
  };

  // Profile
  profile: {
    displayName: string | null;
    startDate: string | null; // ISO date string
  };
}

const defaultSettings: AppSettings = {
  theme: 'system',
  notifications: {
    enabled: false,
    dailyReminderEnabled: false,
    dailyReminderTime: '09:00',
  },
  coach: {
    email: null,
    name: null,
    shareWeeklySummary: false,
  },
  profile: {
    displayName: null,
    startDate: null,
  },
};

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  updateNotifications: (partial: Partial<AppSettings['notifications']>) => Promise<void>;
  updateCoach: (partial: Partial<AppSettings['coach']>) => Promise<void>;
  updateProfile: (partial: Partial<AppSettings['profile']>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new fields
        setSettings({ ...defaultSettings, ...parsed });
      } else {
        // First time - set start date
        const initialSettings = {
          ...defaultSettings,
          profile: {
            ...defaultSettings.profile,
            startDate: new Date().toISOString(),
          },
        };
        setSettings(initialSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...partial };
    await saveSettings(newSettings);
  }, [settings]);

  const updateNotifications = useCallback(async (partial: Partial<AppSettings['notifications']>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...partial },
    };
    await saveSettings(newSettings);
  }, [settings]);

  const updateCoach = useCallback(async (partial: Partial<AppSettings['coach']>) => {
    const newSettings = {
      ...settings,
      coach: { ...settings.coach, ...partial },
    };
    await saveSettings(newSettings);
  }, [settings]);

  const updateProfile = useCallback(async (partial: Partial<AppSettings['profile']>) => {
    const newSettings = {
      ...settings,
      profile: { ...settings.profile, ...partial },
    };
    await saveSettings(newSettings);
  }, [settings]);

  const resetSettings = useCallback(async () => {
    await saveSettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        updateNotifications,
        updateCoach,
        updateProfile,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
