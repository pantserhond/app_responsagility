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
 * Get today's date in YYYY-MM-DD format.
 */
export const getTodayKey = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
