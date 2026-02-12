import { Stack } from 'expo-router'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { WarmPalette, DarkWarmPalette } from '@/constants/theme'

export default function AuthLayout() {
  const colorScheme = useColorScheme()
  const palette = colorScheme === 'dark' ? DarkWarmPalette : WarmPalette

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background.primary },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
    </Stack>
  )
}
