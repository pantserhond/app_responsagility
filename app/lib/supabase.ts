import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const CHUNK_SIZE = 1024

// SecureStore has a 2048 byte value limit. Supabase session JWTs exceed this,
// so we split large values into numbered chunks and reassemble on read.
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    }

    // Try reading as a single value first
    const value = await SecureStore.getItemAsync(key)
    if (value) return value

    // Otherwise reassemble from chunks
    const chunks: string[] = []
    let i = 0
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
      if (!chunk) break
      chunks.push(chunk)
      i++
    }
    return chunks.length > 0 ? chunks.join('') : null
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value)
      }
      return
    }

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value)
      // Clean up any old chunks from a previous larger value
      let i = 0
      while (true) {
        const existing = await SecureStore.getItemAsync(`${key}_${i}`)
        if (!existing) break
        await SecureStore.deleteItemAsync(`${key}_${i}`)
        i++
      }
    } else {
      // Split into chunks
      const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || []
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_${i}`, chunks[i])
      }
      // Remove the non-chunked key if it exists
      await SecureStore.deleteItemAsync(key).catch(() => {})
      // Clean up any extra old chunks beyond current count
      let j = chunks.length
      while (true) {
        const existing = await SecureStore.getItemAsync(`${key}_${j}`)
        if (!existing) break
        await SecureStore.deleteItemAsync(`${key}_${j}`)
        j++
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
      return
    }

    // Remove the main key
    await SecureStore.deleteItemAsync(key).catch(() => {})
    // Remove any chunks
    let i = 0
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
      if (!chunk) break
      await SecureStore.deleteItemAsync(`${key}_${i}`)
      i++
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
