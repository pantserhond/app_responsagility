/**
 * AsyncStorage key constants for Responsagility app.
 */

export const STORAGE_KEYS = {
  // Practice data (daily)
  PRACTICE_PREFIX: 'responsagility-practice-',

  // App settings
  SETTINGS: 'responsagility-settings',

  // User profile
  USER_PROFILE: 'responsagility-profile',

  // Notification state
  NOTIFICATION_ID: 'responsagility-notification-id',

  // Auth (used by Supabase via SecureStore adapter)
  AUTH_SESSION: 'supabase-auth-token',
} as const;

/**
 * Get the storage key for a specific date's practice session.
 */
export const getPracticeKey = (date: string): string =>
  `${STORAGE_KEYS.PRACTICE_PREFIX}${date}`;

/**
 * Format a date as YYYY-MM-DD in the device's local timezone.
 * (toISOString would shift the day near midnight for non-UTC users.)
 */
export const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 */
export const getTodayKey = (): string => toLocalDateKey(new Date());
