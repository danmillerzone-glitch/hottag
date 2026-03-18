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
  metadataBase: new URL('https://www.hottag.app'),
  title: 'Hot Tag - Go See A Show',
  description: 'Go see a show. Discover indie wrestling events, follow your favorite wrestlers, and connect with the wrestling community.',
  keywords: ['wrestling', 'indie wrestling', 'GCW', 'PWG', 'wrestling events', 'independent wrestling'],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hot Tag',
  },
  openGraph: {
    title: 'Hot Tag - Go See A Show',
    description: 'Go see a show.',
    url: 'https://www.hottag.app',
    siteName: 'Hot Tag',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hot Tag - Go See A Show',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot Tag - Go See A Show',
    description: 'Go see a show.',
    creator: '@HotTagApp',
    images: ['/og-image.png'],
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
