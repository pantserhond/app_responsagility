import React, { useState, useCallback, useMemo } from 'react'
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
  Modal,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuth } from '@/context/AuthContext'
import { useAppTheme } from '@/hooks/use-app-theme'
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme'

// Country data with flags and dial codes
const COUNTRIES = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
]

interface FormErrors {
  fullName?: string
  birthday?: string
  mobileNumber?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function calculateAge(birthday: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthday.getFullYear()
  const monthDiff = today.getMonth() - birthday.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--
  }
  return age
}

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [fontsLoaded] = useFonts({ EBGaramond_400Regular })
  const theme = useAppTheme()
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette

  const [fullName, setFullName] = useState('')
  const [birthday, setBirthday] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [countrySearch, setCountrySearch] = useState('')

  const age = useMemo(() => {
    if (!birthday) return null
    return calculateAge(birthday)
  }, [birthday])

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES
    const search = countrySearch.toLowerCase()
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search)
    )
  }, [countrySearch])

  const maxDate = useMemo(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 13) // Must be at least 13
    return date
  }, [])

  const minDate = useMemo(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 120) // Max 120 years old
    return date
  }, [])

  const validate = useCallback(() => {
    const newErrors: FormErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!birthday) {
      newErrors.birthday = 'Birthday is required'
    } else if (age !== null && (age < 13 || age > 120)) {
      newErrors.birthday = 'You must be between 13 and 120 years old'
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required'
    } else if (mobileNumber.replace(/\D/g, '').length < 6) {
      newErrors.mobileNumber = 'Please enter a valid mobile number'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [fullName, birthday, age, mobileNumber, email, password, confirmPassword])

  const handleRegister = useCallback(async () => {
    if (!validate() || age === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setIsLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const fullMobileNumber = `${selectedCountry.dialCode} ${mobileNumber.trim()}`

    const { error } = await signUp({
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      age,
      mobileNumber: fullMobileNumber,
    })

    setIsLoading(false)

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Registration Failed', error.message || 'Something went wrong')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: email.trim().toLowerCase() },
      })
    }
  }, [validate, signUp, email, password, fullName, age, mobileNumber, selectedCountry, router])

  const handleNavigateToLogin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }, [router])

  const handleDateChange = useCallback((_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    if (selectedDate) {
      setBirthday(selectedDate)
    }
  }, [])

  const handleCountrySelect = useCallback((country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    setShowCountryPicker(false)
    setCountrySearch('')
    Haptics.selectionAsync()
  }, [])

  const formatBirthday = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

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
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleNavigateToLogin}>
            <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text.primary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
              Begin your journey of self-discovery
            </Text>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.background.secondary,
                    color: palette.text.primary,
                    borderColor: errors.fullName ? palette.accent.primary : palette.border.light,
                  },
                ]}
                placeholder="Your full name"
                placeholderTextColor={palette.text.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
              {errors.fullName && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.fullName}</Text>
              )}
            </View>

            {/* Birthday */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Birthday</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerButton,
                  {
                    backgroundColor: palette.background.secondary,
                    borderColor: errors.birthday ? palette.accent.primary : palette.border.light,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    { color: birthday ? palette.text.primary : palette.text.muted },
                  ]}
                >
                  {birthday ? formatBirthday(birthday) : 'Select your birthday'}
                </Text>
                {age !== null && (
                  <Text style={[styles.ageText, { color: palette.text.secondary }]}>
                    {age} years old
                  </Text>
                )}
                <Ionicons name="calendar-outline" size={20} color={palette.text.muted} />
              </TouchableOpacity>
              {errors.birthday && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.birthday}</Text>
              )}
            </View>

            {/* Date Picker Modal for iOS */}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal transparent animationType="slide">
                <View style={styles.datePickerModalOverlay}>
                  <View style={[styles.datePickerModal, { backgroundColor: palette.background.secondary }]}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={[styles.datePickerDone, { color: palette.accent.primary }]}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={birthday || maxDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={maxDate}
                      minimumDate={minDate}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {/* Date Picker for Android */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={birthday || maxDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={maxDate}
                minimumDate={minDate}
              />
            )}

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={[
                    styles.countryPicker,
                    {
                      backgroundColor: palette.background.secondary,
                      borderColor: palette.border.light,
                    },
                  ]}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.flag}>{selectedCountry.flag}</Text>
                  <Text style={[styles.dialCode, { color: palette.text.primary }]}>
                    {selectedCountry.dialCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={palette.text.muted} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    {
                      backgroundColor: palette.background.secondary,
                      color: palette.text.primary,
                      borderColor: errors.mobileNumber ? palette.accent.primary : palette.border.light,
                    },
                  ]}
                  placeholder="Phone number"
                  placeholderTextColor={palette.text.muted}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
              {errors.mobileNumber && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.mobileNumber}</Text>
              )}
            </View>

            {/* Country Picker Modal */}
            <Modal visible={showCountryPicker} animationType="slide">
              <SafeAreaView style={[styles.countryModalContainer, { backgroundColor: palette.background.primary }]}>
                <KeyboardAvoidingView
                  style={styles.countryModalKeyboard}
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: palette.text.primary }]}>Select Country</Text>
                    <TouchableOpacity onPress={() => {
                      setShowCountryPicker(false)
                      setCountrySearch('')
                    }}>
                      <Ionicons name="close" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.searchInput,
                      {
                        backgroundColor: palette.background.secondary,
                        color: palette.text.primary,
                        borderColor: palette.border.light,
                      },
                    ]}
                    placeholder="Search countries..."
                    placeholderTextColor={palette.text.muted}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    autoCorrect={false}
                    autoFocus
                  />
                  <FlatList
                    data={filteredCountries}
                    keyExtractor={(item) => item.code}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.countryItem,
                          { borderBottomColor: palette.border.light },
                          selectedCountry.code === item.code && { backgroundColor: palette.accent.muted },
                        ]}
                        onPress={() => handleCountrySelect(item)}
                      >
                        <Text style={styles.countryFlag}>{item.flag}</Text>
                        <Text style={[styles.countryName, { color: palette.text.primary }]}>{item.name}</Text>
                        <Text style={[styles.countryDialCode, { color: palette.text.secondary }]}>
                          {item.dialCode}
                        </Text>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </KeyboardAvoidingView>
              </SafeAreaView>
            </Modal>

            {/* Email */}
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

            {/* Password */}
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
                placeholder="At least 6 characters"
                placeholderTextColor={palette.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
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
                placeholder="Re-enter your password"
                placeholderTextColor={palette.text.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: palette.accent.primary }]}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: palette.accent.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.text.inverse} />
              ) : (
                <Text style={[styles.buttonText, { color: palette.text.inverse }]}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: palette.text.secondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={handleNavigateToLogin}>
              <Text style={[styles.footerLink, { color: palette.accent.primary }]}>
                {' '}Sign in
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  header: {
    marginBottom: Spacing.xl,
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
    gap: Spacing.md,
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

  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },

  ageText: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },

  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },

  flag: {
    fontSize: 20,
  },

  dialCode: {
    fontSize: 16,
  },

  phoneInput: {
    flex: 1,
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
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  footerText: {
    ...Typography.body,
  },

  footerLink: {
    ...Typography.body,
    fontWeight: '600',
  },

  // Date Picker Modal
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  datePickerModal: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },

  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Country Picker Modal
  countryModalContainer: {
    flex: 1,
  },

  countryModalKeyboard: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  searchInput: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },

  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },

  countryFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },

  countryName: {
    flex: 1,
    fontSize: 16,
  },

  countryDialCode: {
    fontSize: 14,
  },
})
