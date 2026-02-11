'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Flame, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const { user, loading, onboardingCompleted, onboardingLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || onboardingLoading) return
    if (user && onboardingCompleted) {
      router.replace('/')
    } else if (user && onboardingCompleted === false) {
      router.replace('/onboarding')
    }
  }, [user, loading, onboardingCompleted, onboardingLoading])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-accent/3 to-transparent pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
            <Flame className="w-10 h-10 text-accent" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl font-display font-black uppercase tracking-tight mb-4">
          Welcome to<br />
          <span className="text-accent">Hot Tag</span>
        </h1>

        <p className="text-lg text-foreground-muted mb-12 max-w-sm mx-auto">
          The home of indie wrestling. Track events, follow wrestlers, and never miss a show.
        </p>

        {/* Buttons */}
        <div className="space-y-3 max-w-xs mx-auto">
          <Link
            href="/signup"
            className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 rounded-xl"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/signin"
            className="w-full btn btn-ghost py-4 text-lg font-medium flex items-center justify-center rounded-xl border border-border hover:border-accent/50"
          >
            I already have an account
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-foreground-muted mt-8">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-accent hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
