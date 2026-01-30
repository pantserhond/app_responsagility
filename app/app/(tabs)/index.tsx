import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFonts, EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond'

type ApiResponse =
  | { type: 'question'; text: string }
  | { type: 'mirror'; text: string }
  | { type: 'completed'; text: string }

type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const STORAGE_KEY = `responsagility-chat-${new Date()
  .toISOString()
  .slice(0, 10)}`

export default function PracticeScreen() {
  const [fontsLoaded] = useFonts({
    EBGaramond_400Regular,
  })

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [hasUserStarted, setHasUserStarted] = useState(false)

  const scrollRef = useRef<ScrollView>(null)
  const [suppressAutoScroll, setSuppressAutoScroll] = useState(false)

  /* ---------- Load today's messages ---------- */
  useEffect(() => {
    ;(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)

      if (stored) {
        const parsed = JSON.parse(stored)
        setMessages(parsed.messages)
        setCompleted(parsed.completed)
      } else {
        setMessages([
          {
            id: uid(),
            role: 'ai',
            text: 'Where did you react from your ego today?',
          },
        ])
      }
    })()
  }, [])

  /* ---------- Persist messages ---------- */
  useEffect(() => {
    if (messages.length === 0) return

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, completed })
    )
  }, [messages, completed])

  /* ---------- Auto-scroll (not during typing) ---------- */
  useEffect(() => {
    if (hasUserStarted && !suppressAutoScroll) {
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages, hasUserStarted, suppressAutoScroll])

  function addAiMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'ai', text },
    ])
  }

  async function resetTodayForTesting() {
    await AsyncStorage.removeItem(STORAGE_KEY)
    setMessages([
      {
        id: uid(),
        role: 'ai',
        text: 'Where did you react from your ego today?',
      },
    ])
    setCompleted(false)
    setInput('')
  }

  async function sendAnswer() {
    if (!input.trim() || completed || loading) return

    const userMessage: Message = {
      id: uid(),
      role: 'user',
      text: input,
    }

    setHasUserStarted(true)

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://192.168.110.202:3000/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'test-user',
          date: new Date().toISOString().slice(0, 10),
          userInput: userMessage.text,
        }),
      })

      const data: ApiResponse = await res.json()

      if (data.type === 'completed') {
        setCompleted(true)
        setSuppressAutoScroll(true)
        addAiMessage(data.text)
        return
      }

      if (data.type === 'mirror') {
        setSuppressAutoScroll(true)
        addAiMessage(data.text)
        return
      }

      if (data.type === 'question') {
        setSuppressAutoScroll(false)
        addAiMessage(data.text)
      }
    } catch {
      addAiMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!fontsLoaded ? null : (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f2efeb' }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              contentInset={{ bottom: 80 }}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.role === 'ai' ? styles.aiMessage : styles.userMessage,
                  ]}
                >
                  <Text style={msg.role === 'ai' ? styles.aiText : styles.userText}>
                    {msg.text}
                  </Text>
                </View>
              ))}

              {completed && (
                <Text style={styles.completedText}>
                  You’ve completed today’s reflection.
                </Text>
              )}

              {__DEV__ && (
                <TouchableOpacity
                  onPress={resetTodayForTesting}
                  style={{ marginBottom: 12 }}
                >
                  <Text style={styles.devText}>🔄 Reset today (dev only)</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Type your response…"
                placeholderTextColor="#888"
                value={input}
                onChangeText={setInput}
                editable={!completed}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (loading || completed || !input.trim()) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={sendAnswer}
                disabled={loading || completed || !input.trim()}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f2efeb',
  },

  message: {
    marginBottom: 20,
    maxWidth: '85%',
  },

  aiMessage: {
    alignSelf: 'flex-start',
  },

  userMessage: {
    alignSelf: 'flex-end',
  },

  aiText: {
    fontFamily: 'EBGaramond_400Regular',
    color: '#505050',
    fontSize: 22,
    lineHeight: 30,
  },

  userText: {
    fontFamily: 'EBGaramond_400Regular',
    color: '#505050',
    fontSize: 22,
    lineHeight: 30,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },

  completedText: {
    fontFamily: 'EBGaramond_400Regular',
    color: '#505050',
    marginVertical: 20,
    textAlign: 'center',
    fontSize: 17,
    opacity: 0.7,
  },

  devText: {
    fontFamily: 'EBGaramond_400Regular',
    color: '#505050',
    fontSize: 13,
    opacity: 0.6,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f2efeb',
    borderTopWidth: 1,
    borderTopColor: '#e0ddd9',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9fb86a',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,

    backgroundColor: '#ffffff',
    color: '#505050',

    fontSize: 20,
    lineHeight: 27,
    fontFamily: 'EBGaramond_400Regular',

    minHeight: 56,   // ~2 lines
    maxHeight: 120,  // ~4–5 lines
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: '#9fb86a',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#cfcfcf',
  },

  sendIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
})