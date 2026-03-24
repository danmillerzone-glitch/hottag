import { supabase, getEventPromotions } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const EVENT_FIELDS = 'id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: wrestler } = await supabase
    .from('wrestlers')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = wrestler?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events featuring ${name}`,
  }
}

export default async function WrestlerPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: wrestler } = await supabase
    .from('wrestlers')
    .select('id, name, slug, photo_url')
    .eq('slug', params.slug)
    .single()

  if (!wrestler) return notFound()

  const today = getTodayHawaii()

  // Union of 3 sources (same pattern as wrestlers/[slug]/page.tsx)
  const { data: ewData } = await supabase
    .from('event_wrestlers')
    .select(`events(${EVENT_FIELDS})`)
    .eq('wrestler_id', wrestler.id)

  const { data: mpData } = await supabase
    .from('match_participants')
    .select(`event_matches(events(${EVENT_FIELDS}))`)
    .eq('wrestler_id', wrestler.id)

  const { data: atData } = await supabase
    .from('event_announced_talent')
    .select(`events(${EVENT_FIELDS})`)
    .eq('wrestler_id', wrestler.id)

  const eventMap = new Map<string, any>()
  for (const d of (ewData || [])) {
    const evt = (d as any).events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }
  for (const d of (mpData || [])) {
    const evt = (d as any).event_matches?.events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }
  for (const d of (atData || [])) {
    const evt = (d as any).events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }

  const events = Array.from(eventMap.values()).sort(
    (a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )

  // Batch-fetch co-promoters
  const eventIds = events.map((e: any) => e.id)
  const eventPromotionsMap = await getEventPromotions(eventIds)
  const eventsWithPromotions = events.map((e: any) => ({
    ...e,
    event_promotions: eventPromotionsMap.get(e.id) || [],
  }))

  return (
    <PastEventsContent
      events={eventsWithPromotions}
      entityName={wrestler.name}
      entitySlug={wrestler.slug}
      entityType="wrestlers"
      entityImageUrl={wrestler.photo_url}
    />
  )
}
