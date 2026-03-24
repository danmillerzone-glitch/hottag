import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 900 // ISR: regenerate every 15 minutes

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: promotion } = await supabase
    .from('promotions')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = promotion?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events for ${name}`,
  }
}

export default async function PromotionPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: promotion } = await supabase
    .from('promotions')
    .select('id, name, slug, logo_url')
    .eq('slug', params.slug)
    .single()

  if (!promotion) return notFound()

  const today = getTodayHawaii()

  // Get event IDs via junction table
  const { data: links } = await supabase
    .from('event_promotions')
    .select('event_id')
    .eq('promotion_id', promotion.id)

  const eventIds = (links || []).map(l => l.event_id)
  const { data: events } = eventIds.length > 0
    ? await supabase
        .from('events')
        .select('id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)')
        .in('id', eventIds)
        .lt('event_date', today)
        .order('event_date', { ascending: false })
    : { data: [] }

  return (
    <PastEventsContent
      events={events || []}
      entityName={promotion.name}
      entitySlug={promotion.slug}
      entityType="promotions"
      entityImageUrl={promotion.logo_url}
    />
  )
}
