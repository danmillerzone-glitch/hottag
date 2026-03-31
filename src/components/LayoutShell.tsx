'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navigation from '@/components/NavigationAuth'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import Footer from '@/components/Footer'
import AuthGate from '@/components/AuthGate'
import { AuthModalProvider } from '@/lib/auth-modal-context'
import AuthModal from '@/components/AuthModal'

// Pages where we hide nav/footer for a clean fullscreen experience
const CHROMELESS_ROUTES = ['/welcome', '/onboarding', '/signin', '/signup', '/map/record']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChromeless = CHROMELESS_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  if (isChromeless) {
    return (
      <AuthGate>
        <main>{children}</main>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <AuthModalProvider>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg">
          Skip to content
        </a>
        <Navigation />
        <AnnouncementBanner />
        <main id="main-content" className="pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <AuthModal />
      </AuthModalProvider>
    </AuthGate>
  )
}
