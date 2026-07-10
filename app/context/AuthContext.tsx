import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'
import { parseAuthCallback } from '@/lib/auth-utils'

export interface Profile {
  id: string
  fullName: string
  age: number
  mobileNumber: string
  email: string
}

export interface SignUpData {
  email: string
  password: string
  fullName: string
  age: number
  mobileNumber: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  handleAuthCallback: (url: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = no rows found, which is normal for new/deleted users
        if (error.code !== 'PGRST116') {
          console.warn('Error fetching profile:', error)
        }
        return null
      }

      return {
        id: data.id,
        fullName: data.full_name,
        age: data.age,
        mobileNumber: data.mobile_number,
        email: data.email,
      } as Profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [])

  // Ensure a profile row exists in the database (needed for foreign key constraints)
  const ensureProfile = useCallback(async (user: User) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? '',
        age: user.user_metadata?.age ?? 0,
        mobile_number: user.user_metadata?.mobile_number ?? '',
        email: user.email ?? '',
      }, { onConflict: 'id' })

    if (error) {
      console.warn('Failed to ensure profile:', error)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }, [user?.id, fetchProfile])

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        // Stale/invalid session in storage — clear it
        console.warn('Clearing invalid stored session:', error.message)
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        let userProfile = await fetchProfile(session.user.id)
        if (!userProfile) {
          // Profile row doesn't exist — create it
          await ensureProfile(session.user)
          userProfile = await fetchProfile(session.user.id)
        }
        setProfile(userProfile ?? {
          id: session.user.id,
          fullName: session.user.user_metadata?.full_name ?? '',
          age: session.user.user_metadata?.age ?? 0,
          mobileNumber: session.user.user_metadata?.mobile_number ?? '',
          email: session.user.email ?? '',
        })
      }

      setIsLoading(false)
    }).catch(async (error) => {
      // Catch any unhandled errors (e.g. failed token refresh)
      console.warn('Auth initialization error:', error.message)
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      setIsLoading(false)
    })

    // Listen for auth changes
    // IMPORTANT: This callback must be synchronous (no async/await) because
    // supabase-js awaits subscriber callbacks internally. An async callback
    // that awaits a DB query would block operations like updateUser/signOut.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Set profile from user metadata immediately, then fetch from DB in background
          const fallbackProfile: Profile = {
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name ?? '',
            age: session.user.user_metadata?.age ?? 0,
            mobileNumber: session.user.user_metadata?.mobile_number ?? '',
            email: session.user.email ?? '',
          }
          setProfile(fallbackProfile)

          fetchProfile(session.user.id).then(async (dbProfile) => {
            if (dbProfile) {
              setProfile(dbProfile)
            } else {
              // Profile row doesn't exist — create it
              await ensureProfile(session.user)
              const created = await fetchProfile(session.user.id)
              if (created) setProfile(created)
            }
          })
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: Linking.createURL('auth/callback'),
          data: {
            full_name: data.fullName,
            age: data.age,
            mobile_number: data.mobileNumber,
          },
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const handleAuthCallback = useCallback(async (url: string) => {
    try {
      const { access_token, refresh_token } = parseAuthCallback(url)

      if (!access_token || !refresh_token) {
        return { error: new Error('Missing tokens in callback URL') }
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        handleAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
