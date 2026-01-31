import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { ThemedText } from '@/components/themed-text'
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'
import { useEffect, useState } from 'react'

export default function DailyReflectionViewer() {
  const { date } = useLocalSearchParams<{ date: string }>()

  const [fontsLoaded] = useFonts({
    EBGaramond_400Regular,
  })

  const [reflection, setReflection] = useState<null | {
    react: string
    respond: string
    notice: string
    learn: string
    mirror: string
  }>(null)

  const clientId = 'test-user'

  useEffect(() => {
    if (!date) return

    fetch(
      `http://192.168.110.202:3000/practice/reflection/${clientId}/${date}`
    )
      .then((res) => res.json())
      .then((data) => {
        setReflection(data)
      })
      .catch(() => {
        setReflection(null)
      })
  }, [date])



    return (
    <ScrollView contentContainerStyle={styles.container}>
        <ThemedText style={styles.date}>
        {date ?? 'Today'}
        </ThemedText>

        <ThemedText type="title" style={styles.title}>
        Daily Reflection
        </ThemedText>

        {!reflection ? (
        <ThemedText style={styles.reflection}>
            Reflection not found.
        </ThemedText>
        ) : (
        <ThemedText style={styles.reflection}>
            {reflection.mirror}
        </ThemedText>
        )}
    </ScrollView>
    )
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    backgroundColor: '#f2efeb',
    flexGrow: 1,
  },

  date: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 14,
    opacity: 0.6,
    color: '#6b6b6b',
    marginBottom: 8,
  },

  title: {
    fontFamily: 'EBGaramond_400Regular',
    marginBottom: 24,
    color: '#1f1f1f',
  },

  reflection: {
    fontFamily: 'EBGaramond_400Regular',
    fontSize: 20,
    lineHeight: 30,
    color: '#2f2f2f',
  },
})