import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email: string }>()
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular })
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette

  const [isChecking, setIsChecking] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerified = useCallback(async () => {
    setIsChecking(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Try to get the session - if email is verified, user should be able to sign in
    const { data: { session }, error } = await supabase.auth.getSession()

    setIsChecking(false)

    if (session) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      Alert.alert(
        'Not Verified Yet',
        'Please click the verification link in your email first, then try again.',
        [{ text: 'OK' }]
      )
    }
  }, [router])

  const handleResendEmail = useCallback(async () => {
    if (!params.email) {
      Alert.alert('Error', 'Email address not found. Please try registering again.')
      return
    }

    setIsResending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: params.email,
    })

    setIsResending(false)

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', error.message || 'Failed to resend verification email')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Email Sent', 'A new verification email has been sent to your inbox.')
    }
  }, [params.email])

  const handleBackToLogin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.replace('/(auth)/login')
  }, [router])

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background.primary }]}>
        <ActivityIndicator size="large" color={palette.accent.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: palette.accent.muted }]}>
            <Ionicons name="mail-outline" size={48} color={palette.accent.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: palette.text.primary }]}>Check Your Email</Text>

          {/* Description */}
          <Text style={[styles.description, { color: palette.text.secondary }]}>
            We've sent a verification link to:
          </Text>
          <Text style={[styles.email, { color: palette.text.primary }]}>
            {params.email || 'your email address'}
          </Text>
          <Text style={[styles.description, { color: palette.text.secondary }]}>
            Click the link in the email to verify your account, then return here.
          </Text>

          {/* Resend Link */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={palette.accent.primary} />
            ) : (
              <Text style={[styles.resendText, { color: palette.accent.primary }]}>
                Didn't receive it? Resend email
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: palette.accent.primary }]}
            onPress={handleVerified}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <ActivityIndicator color={palette.text.inverse} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: palette.text.inverse }]}>
                I've Verified My Email
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.text.secondary }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  description: {
    ...Typography.body,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  email: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },

  resendButton: {
    marginTop: Spacing.xl,
    padding: Spacing.sm,
  },

  resendText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '500',
  },

  buttons: {
    gap: Spacing.md,
  },

  primaryButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    fontSize: 16,
  },
})
