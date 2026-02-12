import { useColorScheme } from 'react-native';
import { useSettings } from '@/context/SettingsContext';
import { WarmPalette, DarkWarmPalette } from '@/constants/theme';

export type AppTheme = 'light' | 'dark';

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  if (settings.theme === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return settings.theme;
}

export function useThemePalette() {
  const theme = useAppTheme();
  return theme === 'dark' ? DarkWarmPalette : WarmPalette;
}
