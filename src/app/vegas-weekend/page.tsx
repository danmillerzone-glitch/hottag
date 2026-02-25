'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Calendar, ExternalLink, MapPin, Star, Ticket } from 'lucide-react'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'

// Vegas Weekend: April 15–19, 2025
const VEGAS_START = '2026-04-15'
const VEGAS_END = '2026-04-19'

interface Collective {
  key: string
  name: string
  description: string
  imageUrl: string | null
}

interface VegasCollective {
  key: string
  name: string
  description: string | null
  image_url: string | null
  ticket_url: string | null
}

export default function VegasWeekendPage() {
  const [events, setEvents] = useState<any[]>([])
  const [collectives, setCollectives] = useState<VegasCollective[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    const [eventsRes, collectivesRes] = await Promise.all([
      supabase
        .from('events')
        .select(`
          id, name, slug, event_date, event_time, doors_time,
          venue_name, city, state, country,
          poster_url, ticket_url, is_free, is_sold_out,
          ticket_price_min, ticket_price_max,
          promotion_id, vegas_weekend, vegas_collective,
          promotions (id, name, slug, logo_url)
        `)
        .gte('event_date', VEGAS_START)
        .lte('event_date', VEGAS_END)
        .eq('vegas_weekend', true)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: true }),
      supabase
        .from('vegas_weekend_collectives')
        .select('*')
        .order('sort_order', { ascending: true })
    ])

    setEvents(eventsRes.data || [])
    setCollectives(collectivesRes.data || [])
    setLoading(false)
  }

  // Separate page hero from event collectives
  const pageHero = collectives.find(c => c.key === 'page-hero')
  const eventCollectives = collectives.filter(c => c.key !== 'page-hero')

  // Group events into collectives and standalone
  const collectiveEvents = eventCollectives.map(collective => {
    const matched = events.filter(e => e.vegas_collective === collective.key)
    return { ...collective, events: matched }
  })

  const assignedEventIds = new Set(collectiveEvents.flatMap(c => c.events.map((e: any) => e.id)))
  const standaloneEvents = events.filter(e => !assignedEventIds.has(e.id))

  // Group standalone by date
  const standaloneByDate = standaloneEvents.reduce<Record<string, any[]>>((acc, e) => {
    const date = e.event_date
    if (!acc[date]) acc[date] = []
    acc[date].push(e)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative border-b border-yellow-500/20 overflow-hidden">
        {/* Background image if uploaded */}
        {pageHero?.image_url && (
          <>
            <Image
              src={pageHero.image_url}
              alt="Vegas Weekend"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          </>
        )}
        {!pageHero?.image_url && (
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/30 via-background to-background" />
        )}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-semibold mb-6 backdrop-blur-sm">
            <Star className="w-4 h-4" />
            April 15–19, 2026
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>
            <span className="text-yellow-400">Vegas</span> Weekend
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            The biggest weekend in independent wrestling descends on Las Vegas.
            Dozens of events, hundreds of wrestlers, one unforgettable weekend.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/70" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-yellow-400" />
              {events.length} Events
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-yellow-400" />
              Las Vegas, NV
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-12">
            {[1, 2].map(i => (
              <div key={i}>
                <div className="h-8 w-64 skeleton rounded mb-4" />
                <div className="h-20 skeleton rounded-xl mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <PosterEventCardSkeleton key={j} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Collectives */}
            {collectiveEvents.map(collective => (
              collective.events.length > 0 && (
                <section key={collective.name}>
                  {/* Collective Header */}
                  <div className="rounded-xl overflow-hidden mb-6 bg-background-secondary border border-border">
                    {collective.image_url && (
                      <div className="relative h-48 sm:h-56">
                        <Image
                          src={collective.image_url}
                          alt={collective.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-background-secondary/80 to-black/20" />
                      </div>
                    )}
                    <div className={`p-6 ${collective.image_url ? '-mt-12 relative z-10' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-display font-bold text-yellow-400 mb-2 drop-shadow-lg">
                            {collective.name}
                          </h2>
                          <p className="text-foreground-muted text-sm leading-relaxed max-w-xl">
                            {collective.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {collective.ticket_url && (
                            <a
                              href={collective.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors whitespace-nowrap"
                            >
                              <Ticket className="w-4 h-4" />
                              Ticket Package
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="text-sm font-semibold text-yellow-400/80 whitespace-nowrap bg-yellow-500/10 px-2.5 py-1 rounded-full">
                            {collective.events.length} shows
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collective Events */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {collective.events.map(event => (
                      <PosterEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )
            ))}

            {/* Standalone Events */}
            {standaloneEvents.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  More Events
                </h2>
                {Object.entries(standaloneByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, dateEvents]) => (
                    <div key={date} className="mb-8">
                      <h3 className="text-lg font-semibold text-foreground-muted mb-3">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {dateEvents.map(event => (
                          <PosterEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  ))}
              </section>
            )}

            {events.length === 0 && (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-yellow-400/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Events coming soon</h3>
                <p className="text-foreground-muted">
                  Vegas Weekend events will be announced soon. Check back later!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
