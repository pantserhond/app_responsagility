/**
 * Theme constants for Responsagility - a warm, inviting reflective space.
 */

import { Platform } from 'react-native';

// Warm palette for a safe, inviting space
export const WarmPalette = {
  // Backgrounds
  background: {
    primary: '#f2efeb',    // Warm beige
    secondary: '#faf8f5',  // Cream for cards
    tertiary: '#ebe7e1',   // Slightly darker for sections
  },

  // Accent colors
  accent: {
    primary: '#9fb86a',    // Sage green
    secondary: '#b5c88a',  // Lighter sage for hover states
    muted: '#d4dfc4',      // Very light sage for backgrounds
  },

  // Text colors
  text: {
    primary: '#3d3d3d',    // Main text
    secondary: '#6b6b6b',  // Subtitles, hints
    muted: '#9a9a9a',      // Disabled states
    inverse: '#faf8f5',    // Text on dark backgrounds
  },

  // Semantic colors
  success: '#8cb369',      // Warm green
  warning: '#e9c46a',      // Warm amber
  error: '#d4776a',        // Warm coral

  // Borders and dividers
  border: {
    light: '#e5e1db',
    medium: '#d4d0c9',
  },
} as const;

// Dark mode variant
export const DarkWarmPalette = {
  background: {
    primary: '#1a1917',
    secondary: '#242220',
    tertiary: '#2e2c29',
  },
  accent: {
    primary: '#a8c173',
    secondary: '#8da85e',
    muted: '#3d4533',
  },
  text: {
    primary: '#e8e5e0',
    secondary: '#b5b0a8',
    muted: '#7a756d',
    inverse: '#1a1917',
  },
  success: '#8cb369',
  warning: '#e9c46a',
  error: '#d4776a',
  border: {
    light: '#3d3a36',
    medium: '#4a4742',
  },
} as const;

// Legacy Colors for compatibility with existing themed components
const tintColorLight = '#9fb86a';
const tintColorDark = '#a8c173';

export const Colors = {
  light: {
    text: WarmPalette.text.primary,
    background: WarmPalette.background.primary,
    tint: tintColorLight,
    icon: WarmPalette.text.secondary,
    tabIconDefault: WarmPalette.text.muted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DarkWarmPalette.text.primary,
    background: DarkWarmPalette.background.primary,
    tint: tintColorDark,
    icon: DarkWarmPalette.text.secondary,
    tabIconDefault: DarkWarmPalette.text.muted,
    tabIconSelected: tintColorDark,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

// Typography
export const Typography = {
  // Question text (AI prompts)
  question: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 24,
    lineHeight: 34,
  },

  // User input/answers
  answer: {
    fontFamily: Platform.select({ ios: 'System', default: 'Roboto' }),
    fontSize: 18,
    lineHeight: 26,
  },

  // Mirror text (special, slightly larger)
  mirror: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    lineHeight: 30,
  },

  // Section headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Small text
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
