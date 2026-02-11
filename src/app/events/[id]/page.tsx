import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEvent, getEventWrestlers } from '@/lib/supabase'
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
import ShareButton from '@/components/ShareButton'
import QRCodeButton from '@/components/QRCodeButton'
import MatchCard from '@/components/MatchCard'
import StreamingLinks from '@/components/StreamingLinks'
import AnnouncedTalentList from '@/components/AnnouncedTalentList'
import CouponCodeButton from '@/components/CouponCodeButton'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

interface EventPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: EventPageProps) {
  const event = await getEvent(params.id)
  
  if (!event) {
    return { title: 'Event Not Found | Hot Tag' }
  }

  return {
    title: `${event.name} | Hot Tag`,
    description: `${event.name} on ${formatEventDateFull(event.event_date)} at ${event.venue_name || formatLocation(event.city, event.state)}`,
    openGraph: {
      title: event.name,
      description: `${formatEventDateFull(event.event_date)} • ${formatLocation(event.city, event.state)}`,
      images: event.poster_url ? [event.poster_url] : undefined,
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  const promotion = event.promotions
  const wrestlers = await getEventWrestlers(event.id)

  // Fetch coupon data directly from events table (view may not include new columns)
  const { data: couponData } = await supabase
    .from('events')
    .select('coupon_code, coupon_label')
    .eq('id', event.id)
    .single()
  const couponCode = couponData?.coupon_code || null
  const couponLabel = couponData?.coupon_label || null

  // Fetch current championships for this promotion to show champion badges
  let championMap: Record<string, string> = {} // wrestler_id -> championship short_name or name
  if (promotion?.id) {
    const { data: championships } = await supabase
      .from('promotion_championships')
      .select('name, short_name, current_champion_id, current_champion_2_id')
      .eq('promotion_id', promotion.id)
      .eq('is_active', true)

    if (championships) {
      for (const c of championships) {
        const label = c.short_name || c.name
        if (c.current_champion_id) championMap[c.current_champion_id] = label
        if (c.current_champion_2_id) championMap[c.current_champion_2_id] = label
      }
    }
  }

  // Fetch related events: same promotion or same city, upcoming, not this event
  const today = new Date().toISOString().split('T')[0]
  let relatedEvents: any[] = []

  // Same promotion events
  if (promotion?.id) {
    const { data: promoEvents } = await supabase
      .from('events')
      .select('id, name, event_date, city, state, country, venue_name, poster_url, promotions(name, slug)')
      .eq('promotion_id', promotion.id)
      .neq('id', event.id)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(4)
    if (promoEvents) relatedEvents.push(...promoEvents)
  }

  // Same city events (if we need more)
  if (relatedEvents.length < 6 && event.city) {
    const { data: cityEvents } = await supabase
      .from('events')
      .select('id, name, event_date, city, state, country, venue_name, poster_url, promotions(name, slug)')
      .eq('city', event.city)
      .neq('id', event.id)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(6 - relatedEvents.length)
    if (cityEvents) {
      const existingIds = new Set(relatedEvents.map(e => e.id))
      relatedEvents.push(...cityEvents.filter(e => !existingIds.has(e.id)))
    }
  }

  relatedEvents = relatedEvents.slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* Hero/Banner */}
      <div className="relative bg-background-secondary">
        {event.poster_url ? (
          <div className="relative h-64 md:h-80 lg:h-96">
            <Image
              src={event.poster_url}
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
          {/* Promotion badge */}
          {promotion && (
            <Link 
              href={`/promotions/${promotion.slug}`}
              className="inline-flex items-center gap-2 badge badge-promotion mb-4 hover:bg-accent/30 transition-colors"
            >
              {promotion.name}
            </Link>
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
                text={`Check out ${event.name}${promotion ? ` by ${promotion.name}` : ''} on ${formatEventDateFull(event.event_date)}${event.city ? ` in ${event.city}` : ''}`}
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
                {event.venue_address && (
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
                    <span className="text-foreground-muted">
                      {(event.city || event.state) && ', '}{event.country}
                    </span>
                  )}
                </div>
                {/* Google Maps link */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [event.venue_name, event.venue_address, event.city, event.state, event.country].filter(Boolean).join(', ')
                  )}`}
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
                    formatPrice(event.ticket_price_min, event.ticket_price_max, event.is_free)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {event.ticket_url && !event.is_sold_out && (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Get Tickets
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            )}
            {couponCode && (
              <CouponCodeButton code={couponCode} label={couponLabel || undefined} />
            )}
            <StreamingLinks eventId={event.id} />
          </div>

          {/* Attendance buttons */}
          <div className="mb-8">
            <AttendanceButtons 
              eventId={event.id}
              initialGoingCount={event.attending_count || 0}
              initialInterestedCount={event.interested_count || 0}
            />
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
                    src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                      [event.venue_name, event.venue_address, event.city, event.state, event.country].filter(Boolean).join(', ')
                    )}`}
                  />
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {event.venue_name && <div className="font-semibold">{event.venue_name}</div>}
                    {event.venue_address && <div className="text-sm text-foreground-muted">{event.venue_address}</div>}
                    <div className="text-sm text-foreground-muted">
                      {[event.city, event.state, event.country !== 'USA' ? event.country : null].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.venue_name, event.venue_address, event.city, event.state, event.country].filter(Boolean).join(', ')
                    )}`}
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
          {promotion && (
            <div className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold mb-4">Presented by</h2>
              <Link
                href={`/promotions/${promotion.slug}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-background-tertiary hover:bg-border transition-colors"
              >
                <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                  {promotion.logo_url ? (
                    <Image
                      src={promotion.logo_url}
                      alt={promotion.name}
                      width={64}
                      height={64}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground-muted">
                        {promotion.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-lg">{promotion.name}</div>
                  <div className="text-foreground-muted text-sm">View all events →</div>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                {promotion.website && (
                  <a
                    href={promotion.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}
                {promotion.twitter_handle && (
                  <a
                    href={getTwitterUrl(promotion.twitter_handle) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <XIcon className="w-4 h-4" />
                    @{promotion.twitter_handle}
                  </a>
                )}
                {promotion.instagram_handle && (
                  <a
                    href={`https://instagram.com/${promotion.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <Instagram className="w-4 h-4" />
                    @{promotion.instagram_handle}
                  </a>
                )}
                {promotion.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${promotion.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <TikTokIcon className="w-4 h-4" />
                    @{promotion.tiktok_handle}
                  </a>
                )}
                {promotion.facebook_url && (
                  <a
                    href={promotion.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
                {promotion.youtube_url && (
                  <a
                    href={promotion.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </a>
                )}
                {promotion.booking_email && (
                  <a
                    href={`mailto:${promotion.booking_email}`}
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                {promotion.merch_url && (
                  <a
                    href={promotion.merch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-muted hover:text-accent transition-colors text-sm flex items-center gap-1"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Merch
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="border-t border-border pt-8">
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
