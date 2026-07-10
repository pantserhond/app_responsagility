import { useEffect } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import 'react-native-reanimated'

// Show daily-reminder notifications even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Android 8+ requires a channel for notifications to display.
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  })
}

import { useColorScheme } from '@/hooks/use-color-scheme'
import { SettingsProvider } from '@/context/SettingsContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { WarmPalette, DarkWarmPalette } from '@/constants/theme'
import { isAuthCallbackUrl } from '@/lib/auth-utils'

export const unstable_settings = {
  anchor: '(tabs)',
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const palette = colorScheme === 'dark' ? DarkWarmPalette : WarmPalette

  // Deep link handling for auth callbacks (email verification)
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (isAuthCallbackUrl(url)) {
        router.replace({ pathname: '/(auth)/callback', params: { url } })
      }
    }

    // Cold start: app launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    // Warm start: deep link received while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url)
    })

    return () => subscription.remove()
  }, [router])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    // The callback screen owns its own navigation (recovery links must land
    // on change-password, not (tabs)) — don't race it with a redirect here.
    if (inAuthGroup && segments[1] === 'callback') return

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated but in auth group
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, segments])

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background.primary }]}>
        <ActivityIndicator size="large" color={palette.accent.primary} />
      </View>
    )
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reflection/[date]" options={{ headerShown: false }} />
        <Stack.Screen name="weekly/[weekStart]" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RootLayoutNav />
      </SettingsProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
