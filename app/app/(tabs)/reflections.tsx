import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

const DAYS_IN_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ReflectionsScreen() {
    const router = useRouter()

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    const daysInMonth = new Date(year, month, 0).getDate()

    const [completedDates, setCompletedDates] = useState<string[]>([])
    const clientId = 'test-user'

  useEffect(() => {
    fetch(`http://192.168.110.202:3000/practice/reflections/${clientId}`)
        .then((res) => res.json())
        .then((data) => {
        setCompletedDates(data.dates ?? [])
        })
        .catch(() => {
        setCompletedDates([])
        })
  }, [])

  return (
    <View style={styles.container}>
      <ThemedText type="title">Reflections</ThemedText>
      <ThemedText style={styles.month}>March 2026</ThemedText>

      <View style={styles.weekHeader}>
        {DAYS_IN_WEEK.map((day) => (
          <ThemedText key={day} style={styles.weekDay}>
            {day}
          </ThemedText>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const completed = completedDates.includes(dateString)

          return (
            <TouchableOpacity
                key={day}
                disabled={!completed}
                style={[
                    styles.dayCell,
                    completed && styles.completedDay,
                    !completed && { opacity: 0.3 },
                ]}
                activeOpacity={0.6}
                onPress={() => {
                    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    router.push(`/reflection/${date}`)
                }}
            >

              <ThemedText
                style={[
                  styles.dayText,
                  completed && styles.completedDayText,
                ]}
              >
                {day}
              </ThemedText>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f2efeb',
  },

  month: {
    marginTop: 4,
    marginBottom: 24,
    opacity: 0.6,
  },

  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  weekDay: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  dayText: {
    fontSize: 16,
    color: '#505050',
  },

  completedDay: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },

  completedDayText: {
    fontWeight: '600',
  },
})
