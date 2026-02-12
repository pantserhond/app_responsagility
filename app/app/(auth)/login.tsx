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
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/context/AuthContext'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular })
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [email, password])

  const handleLogin = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setIsLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const { error } = await signIn(email.trim().toLowerCase(), password)

    setIsLoading(false)

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Login Failed', error.message || 'Invalid email or password')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [email, password, signIn, validate])

  const handleNavigateToRegister = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/(auth)/register')
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text.primary }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
              Sign in to continue your journey
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.background.secondary,
                    color: palette.text.primary,
                    borderColor: errors.email ? palette.accent.primary : palette.border.light,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={palette.text.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.background.secondary,
                    color: palette.text.primary,
                    borderColor: errors.password ? palette.accent.primary : palette.border.light,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={palette.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: palette.accent.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.text.inverse} />
              ) : (
                <Text style={[styles.buttonText, { color: palette.text.inverse }]}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: palette.text.secondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={handleNavigateToRegister}>
              <Text style={[styles.footerLink, { color: palette.accent.primary }]}>
                {' '}Create one
              </Text>
            </TouchableOpacity>
          </View>

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
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
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
    marginTop: Spacing.md,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: Spacing.xl,
  },

  footerText: {
    ...Typography.body,
  },

  footerLink: {
    ...Typography.body,
    fontWeight: '600',
  },

})
