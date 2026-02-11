'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  onboardingCompleted: boolean | null
  onboardingLoading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [onboardingLoading, setOnboardingLoading] = useState(true)
  const supabase = createClient()

  async function checkOnboarding(userId: string) {
    setOnboardingLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single()

    if (data) {
      setOnboardingCompleted(data.onboarding_completed)
    } else {
      // Profile doesn't exist yet (new user) — create it
      await supabase.from('user_profiles').insert({ id: userId, onboarding_completed: false, onboarding_step: 0 })
      setOnboardingCompleted(false)
    }
    setOnboardingLoading(false)
  }

  async function refreshOnboarding() {
    if (user) await checkOnboarding(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        checkOnboarding(session.user.id)
      } else {
        setOnboardingLoading(false)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          checkOnboarding(session.user.id)
        } else {
          setOnboardingCompleted(null)
          setOnboardingLoading(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setOnboardingCompleted(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      onboardingCompleted, onboardingLoading,
      signUp, signIn, signInWithGoogle, signOut,
      refreshOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
