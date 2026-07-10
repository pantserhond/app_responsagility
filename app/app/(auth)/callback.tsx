import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'
import { useAuth } from '@/context/AuthContext'
import { parseAuthCallback } from '@/lib/auth-utils'

export default function AuthCallbackScreen() {
  const { url } = useLocalSearchParams<{ url: string }>()
  const { handleAuthCallback } = useAuth()
  const router = useRouter()
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setError('No callback URL received')
      return
    }

    handleAuthCallback(url).then(({ error }) => {
      if (error) {
        setError(error.message)
        return
      }
      // This screen is exempt from the root layout's auth redirect,
      // so navigate explicitly for every callback type.
      const { type } = parseAuthCallback(url)
      router.replace(type === 'recovery' ? '/change-password' : '/(tabs)')
    })
  }, [url, handleAuthCallback])

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: palette.accent.muted }]}>
              <Ionicons name="alert-circle-outline" size={48} color={palette.accent.primary} />
            </View>
            <Text style={[styles.title, { color: palette.text.primary }]}>
              Verification Failed
            </Text>
            <Text style={[styles.description, { color: palette.text.secondary }]}>
              {error}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.accent.primary }]}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: palette.text.inverse }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={palette.accent.primary} />
          <Text style={[styles.description, { color: palette.text.secondary, marginTop: Spacing.lg }]}>
            Verifying your account...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
