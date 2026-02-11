'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/NavigationAuth'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import Footer from '@/components/Footer'
import AuthGate from '@/components/AuthGate'

// Pages where we hide nav/footer for a clean fullscreen experience
const CHROMELESS_ROUTES = ['/welcome', '/onboarding', '/signin', '/signup']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChromeless = CHROMELESS_ROUTES.some(r => pathname.startsWith(r))

  if (isChromeless) {
    return (
      <AuthGate>
        <main>{children}</main>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <Navigation />
      <AnnouncementBanner />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </AuthGate>
  )
}
