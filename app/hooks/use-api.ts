import { useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.110.202:3000'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export function useApi() {
  const { session } = useAuth()

  const fetchWithAuth = useCallback(
    async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
      const { skipAuth, ...fetchOptions } = options

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      }

      // Add auth header if we have a session and auth isn't skipped
      if (session?.access_token && !skipAuth) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      return response.json()
    },
    [session?.access_token]
  )

  const get = useCallback(
    <T>(endpoint: string, options?: FetchOptions) => {
      return fetchWithAuth<T>(endpoint, { ...options, method: 'GET' })
    },
    [fetchWithAuth]
  )

  const post = useCallback(
    <T>(endpoint: string, data?: unknown, options?: FetchOptions) => {
      return fetchWithAuth<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    },
    [fetchWithAuth]
  )

  return { fetchWithAuth, get, post }
}

export { API_BASE }
