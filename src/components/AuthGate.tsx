'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

// Routes that don't require auth at all
const PUBLIC_ROUTES = [
  '/welcome',
  '/signin',
  '/signup',
  '/onboarding',
  '/auth/callback',
  '/privacy',
  '/terms',
]

// Routes that are public for SEO/sharing (individual pages)
function isPublicSlugRoute(path: string): boolean {
  return (
    /^\/wrestlers\/[^/]+$/.test(path) ||
    /^\/promotions\/[^/]+$/.test(path) ||
    /^\/crew\/[^/]+$/.test(path) ||
    /^\/events\/[^/]+$/.test(path) ||
    /^\/venue\/[^/]+$/.test(path) ||
    /^\/location\/[^/]+$/.test(path)
  )
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted, onboardingLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r)) || isPublicSlugRoute(pathname)

  useEffect(() => {
    if (loading || onboardingLoading) return

    // Public routes — no checks needed
    if (isPublic) return

    // Not logged in — send to welcome
    if (!user) {
      router.replace('/welcome')
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
