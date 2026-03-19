import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Today's Events | Hot Tag",
  description: "Tonight's indie wrestling events — find shows happening today near you.",
  openGraph: {
    title: "Today's Events | Hot Tag",
    description: "Tonight's indie wrestling events — find shows happening today near you.",
    url: 'https://www.hottag.app/events/today',
    siteName: 'Hot Tag',
    type: 'website',
    images: [
      {
        url: 'https://www.hottag.app/api/og-today',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's Events | Hot Tag",
    description: "Tonight's indie wrestling events — find shows happening today near you.",
    images: ['https://www.hottag.app/api/og-today'],
  },
}

export default function TodayEventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
