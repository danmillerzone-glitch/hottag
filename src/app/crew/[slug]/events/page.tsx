import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: professional } = await supabase
    .from('professionals')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = professional?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events featuring ${name}`,
  }
}

export default async function CrewPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, slug, photo_url')
    .eq('slug', params.slug)
    .single()

  if (!professional) return notFound()

  const today = getTodayHawaii()
  const { data: announced } = await supabase
    .from('event_announced_crew')
    .select('events(id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url))')
    .eq('professional_id', professional.id)

  const events = (announced || [])
    .map((d: any) => d.events)
    .filter((evt: any) => evt && evt.event_date < today)
    .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  return (
    <PastEventsContent
      events={events}
      entityName={professional.name}
      entitySlug={professional.slug}
      entityType="crew"
      entityImageUrl={professional.photo_url}
    />
  )
}
