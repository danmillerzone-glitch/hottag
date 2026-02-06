import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navigation from '@/components/NavigationAuth'
import AnnouncementBanner from '@/components/AnnouncementBanner'

export const metadata: Metadata = {
  title: 'HotTag - Indie Wrestling Event Tracker',
  description: 'Never miss another indie show. Discover wrestling events, follow your favorite wrestlers, and connect with the indie wrestling community.',
  keywords: ['wrestling', 'indie wrestling', 'GCW', 'PWG', 'wrestling events', 'independent wrestling'],
  openGraph: {
    title: 'HotTag - Indie Wrestling Event Tracker',
    description: 'Never miss another indie show.',
    url: 'https://hottag.app',
    siteName: 'HotTag',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HotTag - Indie Wrestling Event Tracker',
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
