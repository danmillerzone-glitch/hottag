import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navigation from '@/components/NavigationAuth'
import AnnouncementBanner from '@/components/AnnouncementBanner'

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
      <body className="bg-background text-foreground min-h-screen">
        <AuthProvider>
          <Navigation />
          <AnnouncementBanner />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
