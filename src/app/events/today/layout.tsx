import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  // Use Hawaii time so "today" doesn't flip too early for West Coast
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' })

  // Fetch today's events with promotion names and countries
  const { data: events } = await supabase
    .from('events')
    .select('id, promotions (name, country)')
    .eq('event_date', today)
    .eq('status', 'upcoming')

  const count = events?.length ?? 0

  // Extract unique promotion names, US first
  const usPromos: string[] = []
  const intlPromos: string[] = []
  const seen = new Set<string>()

  for (const e of events ?? []) {
    const promo = (e as any).promotions
    if (!promo?.name || seen.has(promo.name)) continue
    seen.add(promo.name)
    if (promo.country === 'US') {
      usPromos.push(promo.name)
    } else {
      intlPromos.push(promo.name)
    }
  }

  // Build description: count + featured promotions (US prioritized)
  const allPromos = [...usPromos, ...intlPromos]
  let description: string
  if (count === 0) {
    description = "Tonight's indie wrestling events — find shows happening today near you."
  } else {
    const showWord = count === 1 ? 'show' : 'shows'
    if (allPromos.length === 0) {
      description = `${count} indie wrestling ${showWord} tonight.`
    } else if (allPromos.length <= 3) {
      description = `${count} ${showWord} tonight — ${allPromos.join(', ')}.`
    } else {
      description = `${count} ${showWord} tonight — ${allPromos.slice(0, 3).join(', ')} and more.`
    }
  }

  const title = `Today's Events | Hot Tag`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://www.hottag.app/events/today',
      siteName: 'Hot Tag',
      type: 'website',
      images: [
        {
          url: 'https://www.hottag.app/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.hottag.app/og-image.png'],
    },
  }
}

export default function TodayEventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
