import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import * as Haptics from 'expo-haptics'
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular })

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailError, setEmailError] = useState('')

  const validate = useCallback(() => {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email')
      return false
    }
    setEmailError('')
    return true
  }, [email])

  const handleSend = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setIsLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: Linking.createURL('auth/callback'),
    })

    setIsLoading(false)

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', error.message || 'Failed to send reset email')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSent(true)
    }
  }, [email, validate])

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background.primary }]}>
        <ActivityIndicator size="large" color={palette.accent.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text.primary }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
              {sent
                ? 'Check your email for a password reset link.'
                : "Enter your email and we'll send you a reset link."}
            </Text>
          </View>

          {sent ? (
            <View style={[styles.successCard, { backgroundColor: palette.background.secondary }]}>
              <Ionicons name="mail-outline" size={40} color={palette.accent.primary} />
              <Text style={[styles.successText, { color: palette.text.primary }]}>
                Email sent to {email}
              </Text>
              <Text style={[styles.successSubtext, { color: palette.text.secondary }]}>
                Tap the link in the email to set a new password. Check your spam folder if you don’t see it.
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: palette.accent.primary, marginTop: Spacing.lg }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: palette.text.inverse }]}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: palette.text.secondary }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.background.secondary,
                      color: palette.text.primary,
                      borderColor: emailError ? palette.accent.primary : palette.border.light,
                    },
                  ]}
                  placeholder="your@email.com"
                  placeholderTextColor={palette.text.muted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError('') }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  autoFocus
                />
                {emailError ? (
                  <Text style={[styles.errorText, { color: palette.accent.primary }]}>{emailError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: palette.accent.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={palette.text.inverse} />
                ) : (
                  <Text style={[styles.buttonText, { color: palette.text.inverse }]}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 16,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  successText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  successSubtext: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
})
