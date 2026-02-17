import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import LayoutShell from '@/components/LayoutShell'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://floznswkfodjuigfzkki.supabase.co" />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  )
}
