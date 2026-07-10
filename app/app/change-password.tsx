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
import * as Haptics from 'expo-haptics'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})

  const validate = useCallback(() => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {}

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [newPassword, confirmPassword])

  const handleChangePassword = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setIsLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      setIsLoading(false)

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Error', error.message || 'Failed to update password')
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert('Success', 'Your password has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ])
      }
    } catch (err) {
      setIsLoading(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update password')
    }
  }, [newPassword, validate, router])

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
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: palette.text.primary }]}>Change Password</Text>
            <View style={styles.backButton} />
          </View>

          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
            Enter your new password below.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>New Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.background.secondary,
                    color: palette.text.primary,
                    borderColor: errors.newPassword ? palette.accent.primary : palette.border.light,
                  },
                ]}
                placeholder="Enter new password"
                placeholderTextColor={palette.text.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              {errors.newPassword && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>
                  {errors.newPassword}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.background.secondary,
                    color: palette.text.primary,
                    borderColor: errors.confirmPassword ? palette.accent.primary : palette.border.light,
                  },
                ]}
                placeholder="Confirm new password"
                placeholderTextColor={palette.text.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: palette.accent.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.text.inverse} />
              ) : (
                <Text style={[styles.buttonText, { color: palette.text.inverse }]}>
                  Update Password
                </Text>
              )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 16,
    marginBottom: Spacing.xxl,
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
})
