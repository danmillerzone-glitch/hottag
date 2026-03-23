import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

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
  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)')
    .eq('promotion_id', promotion.id)
    .lt('event_date', today)
    .order('event_date', { ascending: false })

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
