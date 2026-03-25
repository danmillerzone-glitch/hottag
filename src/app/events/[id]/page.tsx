import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEvent, getEventWrestlers, getEventPromotions } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import { getHeroCSS } from '@/lib/hero-themes'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  ExternalLink, 
  Users, 
  Share2,
  Bookmark,
  User,
  Instagram,
  Youtube,
  Facebook,
  Mail,
  ShoppingBag,
  Crown
} from 'lucide-react'
import { 
  formatEventDateFull, 
  formatEventTime, 
  formatLocation, 
  formatPrice,
  getTwitterUrl 
} from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import AttendanceButtons from '@/components/AttendanceButtons'
import AddToCalendar from '@/components/AddToCalendar'
import ShareButton from '@/components/ShareButton'
import QRCodeButton from '@/components/QRCodeButton'
import MatchCard from '@/components/MatchCard'
import StreamingLinks from '@/components/StreamingLinks'
import AnnouncedTalentList from '@/components/AnnouncedTalentList'
import { VenueAmenitiesDisplay, EventTagsDisplay } from '@/components/VenueEventDisplay'
import CouponCodeButton from '@/components/CouponCodeButton'
import TicketLink from '@/components/TicketLink'
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker'

export const revalidate = 300 // ISR: regenerate every 5 minutes

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.65a8.35 8.35 0 0 0 4.76 1.49V6.69h-1z" />
    </svg>
  )
}

// Bluesky icon component
function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.178 3.238-4.596.55-8.626 2.04-3.39 7.205 5.42 4.244 7.108-1.012 8.588-4.65.134-.33.221-.547.288-.547.066 0 .154.218.288.547 1.48 3.638 3.168 8.894 8.588 4.65 5.236-5.165 1.206-6.655-3.39-7.205 2.578.238 5.393-.611 6.178-3.238.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  )
}

// Patreon icon component
function PatreonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z" />
    </svg>
  )
}

interface EventPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: EventPageProps) {
  const event = await getEvent(params.id)
  
  if (!event) {
    return { title: 'Event Not Found | Hot Tag' }
  }

  const ogImage = event.landscape_poster_url || event.poster_url || `https://www.hottag.app/api/og?type=event&id=${params.id}&v=5`
  const description = `${event.name} on ${formatEventDateFull(event.event_date)} at ${event.venue_name || formatLocation(event.city, event.state, event.country)}`
  const pageUrl = `https://www.hottag.app/events/${params.id}`
  return {
    title: `${event.name} | Hot Tag`,
    description,
    openGraph: {
      title: `${event.name} | Hot Tag`,
      description: `${formatEventDateFull(event.event_date)} • ${formatLocation(event.city, event.state, event.country)}`,
      url: pageUrl,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.name} | Hot Tag`,
      description: `${formatEventDateFull(event.event_date)} • ${formatLocation(event.city, event.state, event.country)}`,
      images: [ogImage],
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  // Fetch all co-promoters for this event
  const eventPromotionsMap = await getEventPromotions([event.id])
  const allPromotions = (eventPromotionsMap.get(event.id) || []).map(ep => ep.promotions)
  // Backward compat: use junction data if available, fall back to single FK join
  const promotion = allPromotions[0] || event.promotions
  const allCardWrestlers = await getEventWrestlers(event.id)

  // Filter out wrestlers already in announced talent to avoid duplicates
  const { data: announcedTalentIds } = await supabase
    .from('event_announced_talent')
    .select('wrestler_id')
    .eq('event_id', event.id)
  const announcedSet = new Set((announcedTalentIds || []).map((at: any) => at.wrestler_id))
  const wrestlers = allCardWrestlers.filter(w => !announcedSet.has(w.id))

  // Fetch coupon + hashtag data directly from events table (view may not include new columns)
  const { data: extraData } = await supabase
    .from('events')
    .select('coupon_code, coupon_label, hashtag')
    .eq('id', event.id)
    .single()
  const couponCode = extraData?.coupon_code || null
  const couponLabel = extraData?.coupon_label || null
  const hashtag = extraData?.hashtag || null

  // Fetch current championships for ALL co-promoters to show champion badges
  let championMap: Record<string, string> = {} // wrestler_id -> championship short_name or name
  const coPromoterIds = allPromotions.map(p => p.id)
  if (coPromoterIds.length > 0) {
    const { data: championships } = await supabase
      .from('promotion_championships')
      .select('name, short_name, current_champion_id, current_champion_2_id')
      .in('promotion_id', coPromoterIds)
      .eq('is_active', true)

    if (championships) {
      for (const c of championships) {
        const label = c.short_name || c.name
        if (c.current_champion_id) championMap[c.current_champion_id] = label
        if (c.current_champion_2_id) championMap[c.current_champion_2_id] = label
      }
    }
  }

  // Fetch related events: same promotion(s), upcoming, not this event
  const today = getTodayHawaii()
  let relatedEvents: any[] = []

  if (coPromoterIds.length > 0) {
    // Fetch event IDs from any co-promoter
    const { data: relatedEventLinks } = await supabase
      .from('event_promotions')
      .select('event_id')
      .in('promotion_id', coPromoterIds)

    const relatedEventIds = Array.from(new Set(
      (relatedEventLinks || []).map((ep: any) => ep.event_id).filter((id: string) => id !== event.id)
    ))

    if (relatedEventIds.length > 0) {
      const { data: promoEvents } = await supabase
        .from('events')
        .select('id, name, event_date, city, state, country, venue_name, poster_url, promotions(name, slug)')
        .in('id', relatedEventIds)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(6)
      relatedEvents = promoEvents || []
    }
  }

  // Build maps query: always include city/state for disambiguation
  const mapsQuery = event.venue_address && /\d/.test(event.venue_address)
    ? [event.venue_address, event.city, event.state].filter(Boolean).join(', ')
    : [event.venue_name, event.city, event.state, event.country].filter(Boolean).join(', ')

  // Schema.org JSON-LD for Google Rich Snippets
  // Build ISO 8601 startDate — Google requires datetime, not just date
  const startDate = event.event_time
    ? `${event.event_date}T${event.event_time}`
    : `${event.event_date}T19:00:00`

  const eventStatusMap: Record<string, string> = {
    upcoming: 'https://schema.org/EventScheduled',
    cancelled: 'https://schema.org/EventCancelled',
    postponed: 'https://schema.org/EventPostponed',
    completed: 'https://schema.org/EventScheduled',
  }

  const locationName = event.venue_name || formatLocation(event.city, event.state, event.country) || 'TBA'
  const eventDescription = event.description
    || `${event.name} on ${formatEventDateFull(event.event_date)} at ${locationName}`
  const eventImage = event.poster_url || `https://www.hottag.app/api/og?type=event&id=${event.id}&v=4`

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.name,
    description: eventDescription,
    startDate,
    eventStatus: eventStatusMap[event.status] || 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.doors_time && { doorTime: `${event.event_date}T${event.doors_time}` }),
    location: {
      '@type': 'Place',
      name: locationName,
      address: {
        '@type': 'PostalAddress',
        ...(event.venue_address && { streetAddress: event.venue_address }),
        addressLocality: event.city || undefined,
        addressRegion: event.state || undefined,
        addressCountry: event.country || 'US',
      },
      ...(event.latitude && event.longitude && {
        geo: { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude },
      }),
    },
    image: eventImage,
    ...(event.ticket_url && {
      offers: {
        '@type': 'Offer',
        url: event.ticket_url,
        ...(event.is_free
          ? { price: '0', priceCurrency: 'USD' }
          : event.ticket_price_min
            ? { price: String(event.ticket_price_min), priceCurrency: 'USD' }
            : {}),
        availability: event.is_sold_out
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      },
    }),
    ...(promotion && {
      organizer: {
        '@type': 'SportsOrganization',
        name: promotion.name,
        url: `https://www.hottag.app/promotions/${promotion.slug}`,
      },
    }),
    ...(wrestlers && wrestlers.length > 0 && {
      performer: wrestlers.map((w: any) => ({
        '@type': 'Person',
        name: w.wrestlers?.name,
        url: w.wrestlers?.slug ? `https://www.hottag.app/wrestlers/${w.wrestlers.slug}` : undefined,
        ...(w.wrestlers?.photo_url && { image: w.wrestlers.photo_url }),
      })),
    }),
    url: `https://www.hottag.app/events/${event.id}`,
    sport: 'Professional Wrestling',
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentlyViewedTracker
        type="event"
        id={event.id}
        name={event.name}
        image={event.poster_url}
        subtitle={promotion?.name || formatLocation(event.city, event.state, event.country)}
      />
      {/* Hero/Banner */}
      <div className="relative bg-background-secondary">
        {(event.landscape_poster_url || event.poster_url) ? (
          <div className="relative h-64 md:h-80 lg:h-96">
            <Image
              src={(event.landscape_poster_url || event.poster_url)!}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-background-secondary/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 md:h-40 bg-gradient-to-br from-accent/20 to-background-tertiary" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Main content card */}
        <div className="card p-6 md:p-8">
          {/* Promotion badges */}
          {allPromotions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {allPromotions.map(p => (
                <Link
                  key={p.id}
                  href={`/promotions/${p.slug}`}
                  className="inline-flex items-center gap-2 badge badge-promotion hover:bg-accent/30 transition-colors"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title with QR/Share */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              {event.name}
            </h1>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
              <QRCodeButton url={`https://www.hottag.app/events/${event.id}`} name={event.name} />
              <ShareButton
                title={event.name}
                text={`Check out ${event.name}${promotion ? ` by ${promotion.name}` : ''} on ${formatEventDateFull(event.event_date)}${event.city ? ` in ${event.city}` : ''}${hashtag ? ` #${hashtag}` : ''}`}
                url={`https://www.hottag.app/events/${event.id}`}
              />
            </div>
          </div>

          {/* Key info grid */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Date */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background-tertiary">
              <Calendar className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-foreground-muted">Date</div>
                <div className="font-semibold">{formatEventDateFull(event.event_date)}</div>
              </div>
            </div>

            {/* Time */}
            {(event.event_time || event.doors_time) && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background-tertiary">
                <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-foreground-muted">Time</div>
                  <div className="font-semibold">
                    {event.event_time && `Bell: ${formatEventTime(event.event_time)}`}
                    {event.event_time && event.doors_time && ' • '}
                    {event.doors_time && `Doors: ${formatEventTime(event.doors_time)}`}
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background-tertiary">
              <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground-muted">Location</div>
                {event.venue_name && (
                  <div className="font-semibold">
                    <Link 
                      href={`/venue/${encodeURIComponent(event.venue_name.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="hover:text-accent hover:underline"
                    >
                      {event.venue_name}
                    </Link>
                  </div>
                )}
                {event.venue_address && /\d/.test(event.venue_address) && (
                  <div className="text-sm text-foreground-muted mt-0.5">{event.venue_address}</div>
                )}
                <div className="text-sm mt-0.5">
                  {event.city && (
                    <Link 
                      href={`/location/${encodeURIComponent(event.city.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="text-foreground-muted hover:text-accent hover:underline"
                    >
                      {event.city}
                    </Link>
                  )}
                  {event.city && event.state && ', '}
                  {event.state && (
                    <Link 
                      href={`/location/${event.state}`}
                      className="text-foreground-muted hover:text-accent hover:underline"
                    >
                      {event.state}
                    </Link>
                  )}
                  {event.country && event.country !== 'USA' && (
                    <Link
                      href={`/location/${encodeURIComponent(event.country.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="text-foreground-muted hover:text-accent hover:underline"
                    >
                      {(event.city || event.state) && ', '}{event.country}
                    </Link>
                  )}
                </div>
                {/* Google Maps link */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline mt-2 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Maps
                </a>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background-tertiary">
              <Ticket className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-foreground-muted">Tickets</div>
                <div className="font-semibold">
                  {event.is_sold_out ? (
                    <span className="text-red-400">Sold Out</span>
                  ) : (
                    formatPrice(event.ticket_price_min, event.ticket_price_max, event.is_free, event.ticket_price_display)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {event.ticket_url && !event.is_sold_out && (
              <TicketLink
                href={event.ticket_url}
                eventName={event.name}
                promotionName={promotion?.name}
              />
            )}
            {couponCode && (
              <CouponCodeButton code={couponCode} label={couponLabel || undefined} />
            )}
            <StreamingLinks eventId={event.id} />
          </div>

          {/* Attendance buttons + Calendar icons */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <AttendanceButtons
                eventId={event.id}
                initialGoingCount={event.attending_count || 0}
                initialInterestedCount={event.interested_count || 0}
              />
              <AddToCalendar
                eventName={event.name}
                eventDate={event.event_date}
                eventTime={event.event_time}
                doorsTime={event.doors_time}
                venueName={event.venue_name}
                city={event.city}
                state={event.state}
                venueAddress={event.venue_address}
                description={event.description}
                eventUrl={`https://www.hottag.app/events/${event.id}`}
              />
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">About this event</h2>
              <p className="text-foreground-muted whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Event Tags */}
          {event.event_tags && event.event_tags.length > 0 && (
            <EventTagsDisplay tags={event.event_tags} />
          )}

          {/* Venue Info */}
          {event.venue_amenities && Object.values(event.venue_amenities).some((v: any) => v) && (
            <VenueAmenitiesDisplay amenities={event.venue_amenities} />
          )}

          {/* Match Card (from promoter-managed matches) */}
          <MatchCard eventId={event.id} championMap={championMap} />

          {/* Announced Talent */}
          <AnnouncedTalentList eventId={event.id} championMap={championMap} />

          {/* Wrestler Card */}
          {wrestlers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Card ({wrestlers.length} wrestlers)</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {wrestlers.map((wrestler) => {
                  const imageUrl = wrestler.render_url || wrestler.photo_url
                  const heroCSS = getHeroCSS(wrestler.hero_style || null)
                  const hasTheme = !!wrestler.hero_style
                  const isChamp = !!championMap[wrestler.id]

                  return (
                    <Link key={wrestler.id} href={`/wrestlers/${wrestler.slug}`} className="block group">
                      <div className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary ${isChamp ? 'border-2 border-yellow-500/60' : ''}`}>
                        {hasTheme && (
                          <div className="absolute inset-0 z-[0]">
                            {wrestler.hero_style?.type === 'flag' ? (
                              <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${wrestler.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            ) : (
                              <>
                                <div className="absolute inset-0" style={{ background: heroCSS.background, opacity: 0.5 }} />
                                {heroCSS.texture && (
                                  <div className="absolute inset-0" style={{ background: heroCSS.texture, opacity: 0.3 }} />
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {imageUrl ? (
                          <>
                            <Image
                              src={imageUrl}
                              alt={wrestler.name}
                              fill
                              className={`${wrestler.render_url ? 'object-contain object-bottom' : 'object-cover'} group-hover:scale-105 transition-transform duration-300 relative z-[1]`}
                              sizes="160px"
                              unoptimized
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-12 h-12 text-foreground-muted/30" />
                          </div>
                        )}
                        {isChamp && (
                          <div className="absolute top-2 right-2 z-[3]">
                            <Crown className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 z-[3]">
                          {wrestler.moniker && (
                            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
                              &ldquo;{wrestler.moniker}&rdquo;
                            </span>
                          )}
                          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
                            {wrestler.name}
                          </span>
                          {isChamp && (
                            <span className="text-[10px] font-semibold text-yellow-400 line-clamp-1 drop-shadow-lg">
                              {championMap[wrestler.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Map Section */}
          {(event.city || event.venue_name) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Location</h2>
              <div className="rounded-lg bg-background-tertiary overflow-hidden">
                {/* Embedded Google Maps iframe */}
                <div className="aspect-video w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(mapsQuery)}`}
                  />
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {event.venue_name && <div className="font-semibold">{event.venue_name}</div>}
                    {event.venue_address && /\d/.test(event.venue_address) && <div className="text-sm text-foreground-muted">{event.venue_address}</div>}
                    <div className="text-sm text-foreground-muted">
                      {[event.city, event.state, event.country !== 'USA' ? event.country : null].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary flex-shrink-0"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Promotion info */}
          {allPromotions.length > 0 && (
            <div className="border-t border-border mt-4 pt-8">
              <h2 className="text-xl font-semibold mb-4">Presented by</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {allPromotions.map((promo) => (
                  <Link
                    key={promo.id}
                    href={`/promotions/${promo.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background-tertiary hover:bg-border transition-colors"
                  >
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {promo.logo_url ? (
                        <Image
                          src={promo.logo_url}
                          alt={promo.name}
                          width={64}
                          height={64}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-foreground-muted">
                            {promo.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{promo.name}</div>
                      <div className="text-foreground-muted text-sm">View all events →</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="border-t border-border mt-4 pt-8">
              <h2 className="text-xl font-semibold mb-4">More Events</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {relatedEvents.map((related: any) => (
                  <Link
                    key={related.id}
                    href={`/events/${related.id}`}
                    className="card p-4 hover:border-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-accent font-bold text-xs">
                          {new Date(related.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(related.event_date + 'T12:00:00').getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
                          {related.name}
                        </div>
                        <div className="text-xs text-foreground-muted truncate">
                          {related.promotions?.name}
                          {related.city && ` · ${related.city}`}
                          {related.state && `, ${related.state}`}
                          {related.country && related.country !== 'USA' && `, ${related.country}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
