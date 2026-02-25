import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import LayoutShell from '@/components/LayoutShell'
import CookieConsent from '@/components/CookieConsent'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: 'Hot Tag - Indie Wrestling Event Tracker',
  description: 'Never miss another indie show. Discover wrestling events, follow your favorite wrestlers, and connect with the indie wrestling community.',
  keywords: ['wrestling', 'indie wrestling', 'GCW', 'PWG', 'wrestling events', 'independent wrestling'],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Hot Tag - Indie Wrestling Event Tracker',
    description: 'Never miss another indie show.',
    url: 'https://hottag.app',
    siteName: 'Hot Tag',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot Tag - Indie Wrestling Event Tracker',
    description: 'Never miss another indie show.',
    creator: '@HotTagApp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://floznswkfodjuigfzkki.supabase.co" />
        {/* Plausible Analytics — privacy-focused, cookie-free */}
        <script
          defer
          data-domain="hottag.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  )
}
