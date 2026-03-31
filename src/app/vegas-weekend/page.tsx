'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Calendar, ExternalLink, LayoutGrid, List, MapPin, Star, Ticket } from 'lucide-react'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'

// Vegas Weekend: April 14–19, 2026
const VEGAS_START = '2026-04-14'
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [collectives, setCollectives] = useState<VegasCollective[]>([])
  const [loading, setLoading] = useState(true)

  const viewMode = searchParams.get('view') === 'schedule' ? 'schedule' : 'collectives'
  const setViewMode = (mode: 'collectives' | 'schedule') => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'schedule') params.set('view', 'schedule')
    else params.delete('view')
    router.replace(`/vegas-weekend${params.size ? '?' + params.toString() : ''}`, { scroll: false })
  }

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
          promotion_id, vegas_weekend, vegas_collective, event_tags,
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

    let eventsWithPromos = eventsRes.data || []

    // Batch-fetch co-promoters
    const eventIds = eventsWithPromos.map((e: any) => e.id)
    if (eventIds.length > 0) {
      const { data: eventPromos } = await supabase
        .from('event_promotions')
        .select('event_id, promotion_id, promotions(id, name, slug, logo_url)')
        .in('event_id', eventIds)

      const promoMap = new Map<string, any[]>()
      for (const ep of (eventPromos || [])) {
        if (!promoMap.has(ep.event_id)) promoMap.set(ep.event_id, [])
        promoMap.get(ep.event_id)!.push(ep)
      }

      eventsWithPromos = eventsWithPromos.map((e: any) => ({
        ...e,
        event_promotions: promoMap.get(e.id) || [],
      }))
    }

    setEvents(eventsWithPromos)
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
            April 14–19, 2026
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
        {/* View Toggle */}
        {!loading && events.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg bg-background-secondary border border-border p-1">
              <button
                onClick={() => setViewMode('collectives')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'collectives'
                    ? 'bg-yellow-500 text-black'
                    : 'text-yellow-400/70 hover:text-yellow-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Collectives
              </button>
              <button
                onClick={() => setViewMode('schedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'schedule'
                    ? 'bg-yellow-500 text-black'
                    : 'text-yellow-400/70 hover:text-yellow-400'
                }`}
              >
                <List className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        )}

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
        ) : viewMode === 'schedule' ? (
          /* ── Schedule View ── */
          <div>
            {Object.entries(
              events.reduce<Record<string, any[]>>((acc, e) => {
                const date = e.event_date
                if (!acc[date]) acc[date] = []
                acc[date].push(e)
                return acc
              }, {})
            )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateEvents]) => (
                <div key={date} className="mb-2">
                  {/* Sticky day header */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-yellow-500/30 py-3 px-4 -mx-4 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8 flex items-center gap-3">
                    <h3 className="text-lg font-display font-bold text-yellow-400 uppercase tracking-wide">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <span className="text-xs font-semibold text-yellow-400/60 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      {dateEvents.length} {dateEvents.length === 1 ? 'show' : 'shows'}
                    </span>
                  </div>
                  {/* Event rows */}
                  <div className="divide-y divide-border">
                    {dateEvents.map((event: any) => {
                      const promos = event.event_promotions || []
                      const firstPromo = promos[0]?.promotions
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex items-center gap-3 py-3 px-4 -mx-4 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8 hover:bg-background-secondary transition-colors group"
                        >
                          {/* Time */}
                          <span className="w-[72px] sm:w-[80px] flex-shrink-0 text-sm text-foreground-muted tabular-nums">
                            {event.event_time
                              ? new Date(`2000-01-01T${event.event_time}`).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'TBA'}
                          </span>
                          {/* Promo logo */}
                          {firstPromo?.logo_url && (
                            <Image
                              src={firstPromo.logo_url}
                              alt=""
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded-sm object-contain flex-shrink-0"
                              unoptimized
                            />
                          )}
                          {/* Event name */}
                          <span className="flex-1 min-w-0 font-semibold text-sm sm:text-base text-foreground group-hover:text-yellow-400 transition-colors truncate">
                            {event.name}
                          </span>
                          {/* Badges */}
                          {event.is_sold_out && (
                            <span className="flex-shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                              Sold Out
                            </span>
                          )}
                          {event.is_free && !event.is_sold_out && (
                            <span className="flex-shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                              Free
                            </span>
                          )}
                          {/* Venue */}
                          <span className="hidden sm:block flex-shrink-0 text-sm text-foreground-muted max-w-[200px] truncate text-right">
                            {event.venue_name}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* ── Collectives View ── */
          <div className="space-y-12">
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
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-display font-bold text-yellow-400 drop-shadow-lg">
                              {collective.name}
                            </h2>
                            {collective.ticket_url && (
                              <a
                                href={collective.ticket_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors whitespace-nowrap sm:hidden"
                              >
                                <Ticket className="w-4 h-4" />
                                Ticket Package
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <span className="text-sm font-semibold text-yellow-400/80 whitespace-nowrap bg-yellow-500/10 px-2.5 py-1 rounded-full sm:hidden">
                              {collective.events.length} {collective.events.length === 1 ? 'show' : 'shows'}
                            </span>
                          </div>
                          <p className="text-foreground-muted text-sm leading-relaxed">
                            {collective.description}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
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
                            {collective.events.length} {collective.events.length === 1 ? 'show' : 'shows'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collective Events */}
                  {(collective.key === 'parties-signings' || collective.key === 'more-events') ? (
                    // Date-grouped layout for miscellaneous / overflow events
                    Object.entries(
                      collective.events.reduce<Record<string, any[]>>((acc, e) => {
                        const date = e.event_date
                        if (!acc[date]) acc[date] = []
                        acc[date].push(e)
                        return acc
                      }, {})
                    )
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
                      ))
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {collective.events.map(event => (
                        <PosterEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </section>
              )
            ))}

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
