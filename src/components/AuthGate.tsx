'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

// Routes that match exactly (without prefix)
const EXACT_PUBLIC_ROUTES = new Set([
  '/',
  '/events',
  '/wrestlers',
  '/promotions',
  '/crew',
  '/map',
  '/search',
])

// Routes that are public with prefix matching
const PREFIX_PUBLIC_ROUTES = [
  '/welcome',
  '/signin',
  '/signup',
  '/onboarding',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/vegas-weekend',
  '/reset-password',
  '/for-promotions',
  '/blog',
  '/map/record',
]

// Routes that are public for SEO/sharing (individual pages)
function isPublicSlugRoute(path: string): boolean {
  return (
    /^\/wrestlers\/[^/]+$/.test(path) ||
    /^\/promotions\/[^/]+$/.test(path) ||
    /^\/crew\/[^/]+$/.test(path) ||
    /^\/events\/[^/]+$/.test(path) ||
    /^\/venue\/[^/]+$/.test(path) ||
    /^\/location\/[^/]+$/.test(path) ||
    /^\/promotions\/[^/]+\/events$/.test(path) ||
    /^\/wrestlers\/[^/]+\/events$/.test(path) ||
    /^\/crew\/[^/]+\/events$/.test(path)
  )
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted, onboardingLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = EXACT_PUBLIC_ROUTES.has(pathname)
    || PREFIX_PUBLIC_ROUTES.some(r => pathname.startsWith(r))
    || isPublicSlugRoute(pathname)

  useEffect(() => {
    if (loading || onboardingLoading) return

    // Public routes — no checks needed
    if (isPublic) return

    // Not logged in — send to signin
    if (!user) {
      router.replace('/signin')
      return
    }

    // Logged in but onboarding not done — send to onboarding
    if (onboardingCompleted === false) {
      router.replace('/onboarding')
      return
    }
  }, [user, loading, onboardingCompleted, onboardingLoading, pathname])

  // Show loading while checking auth
  if (loading || onboardingLoading) {
    // For public routes, show content while loading
    if (isPublic) return <>{children}</>

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  // Public routes always render
  if (isPublic) return <>{children}</>

  // Not authenticated
  if (!user) return null

  // Needs onboarding
  if (onboardingCompleted === false) return null

  // All clear
  return <>{children}</>
}
