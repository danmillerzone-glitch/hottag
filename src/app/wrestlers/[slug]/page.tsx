import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Calendar, ExternalLink, Trophy, Crown, Instagram, Youtube, Globe, Mail, ShoppingBag } from 'lucide-react'
import { formatEventDateFull } from '@/lib/utils'
import { getFlag, getCountryName } from '@/lib/countries'
import FollowWrestlerButton from '@/components/FollowWrestlerButton'
import ClaimWrestlerButton from '@/components/ClaimWrestlerButton'

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

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WrestlerPageProps {
  params: { slug: string }
}

async function getWrestler(slug: string) {
  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching wrestler:', error)
    return null
  }

  return data
}

async function getWrestlerEvents(wrestlerId: string) {
  // 1. Events from event_wrestlers (scraped card)
  const { data: ewData } = await supabase
    .from('event_wrestlers')
    .select(`
      events (
        id, name, slug, event_date, city, state,
        promotions ( name, slug )
      )
    `)
    .eq('wrestler_id', wrestlerId)

  // 2. Events from match_participants (promoter-managed matches)
  const { data: mpData } = await supabase
    .from('match_participants')
    .select(`
      event_matches (
        events (
          id, name, slug, event_date, city, state,
          promotions ( name, slug )
        )
      )
    `)
    .eq('wrestler_id', wrestlerId)

  // 3. Events from event_announced_talent
  const { data: atData } = await supabase
    .from('event_announced_talent')
    .select(`
      events (
        id, name, slug, event_date, city, state,
        promotions ( name, slug )
      )
    `)
    .eq('wrestler_id', wrestlerId)

  // Combine and deduplicate by event id
  const eventMap = new Map<string, any>()

  for (const d of (ewData || [])) {
    const evt = (d as any).events
    if (evt) eventMap.set(evt.id, evt)
  }
  for (const d of (mpData || [])) {
    const evt = (d as any).event_matches?.events
    if (evt) eventMap.set(evt.id, evt)
  }
  for (const d of (atData || [])) {
    const evt = (d as any).events
    if (evt) eventMap.set(evt.id, evt)
  }

  // Sort by date
  const events = Array.from(eventMap.values())
    .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  return events
}

async function getFollowerCount(wrestlerId: string) {
  const { count } = await supabase
    .from('user_follows_wrestler')
    .select('*', { count: 'exact', head: true })
    .eq('wrestler_id', wrestlerId)

  return count || 0
}

async function getWrestlerChampionships(wrestlerId: string) {
  // Championships where this wrestler is current champion (either slot)
  const { data: asChamp1, error: err1 } = await supabase
    .from('promotion_championships')
    .select(`
      id, name, short_name, won_date, is_active,
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug),
      promotions (id, name, slug, logo_url)
    `)
    .eq('current_champion_id', wrestlerId)
    .eq('is_active', true)

  const { data: asChamp2, error: err2 } = await supabase
    .from('promotion_championships')
    .select(`
      id, name, short_name, won_date, is_active,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug),
      promotions (id, name, slug, logo_url)
    `)
    .eq('current_champion_2_id', wrestlerId)
    .eq('is_active', true)

  if (err1) console.error('Error fetching championships (champ1):', err1)
  if (err2) console.error('Error fetching championships (champ2):', err2)

  const championships = [
    ...(asChamp1 || []).map((c: any) => ({ ...c, partner: c.current_champion_2 })),
    ...(asChamp2 || []).map((c: any) => ({ ...c, partner: c.current_champion })),
  ]

  return championships
}

export async function generateMetadata({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)
  
  if (!wrestler) {
    return { title: 'Wrestler Not Found | HotTag' }
  }

  return {
    title: `${wrestler.name} | HotTag`,
    description: `Follow ${wrestler.name} on HotTag to see their upcoming events.`,
  }
}

export default async function WrestlerPage({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)

  if (!wrestler) {
    notFound()
  }

  const events = await getWrestlerEvents(wrestler.id)
  const followerCount = await getFollowerCount(wrestler.id)
  const championships = await getWrestlerChampionships(wrestler.id)
  
  // Split events into upcoming and past (compare dates only, not time)
  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = events.filter((e: any) => e.event_date >= today)
  const pastEvents = events.filter((e: any) => e.event_date < today)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Photo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
              {wrestler.photo_url ? (
                <Image
                  src={wrestler.photo_url}
                  alt={wrestler.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-16 h-16 text-foreground-muted" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {wrestler.name}
                </h1>
                {wrestler.pwi_ranking && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold">
                    PWI #{wrestler.pwi_ranking}
                  </span>
                )}
              </div>
              
              {wrestler.hometown && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-foreground-muted mb-4">
                  <MapPin className="w-4 h-4" />
                  {wrestler.hometown}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <FollowWrestlerButton 
                  wrestlerId={wrestler.id}
                  wrestlerName={wrestler.name}
                  initialFollowerCount={followerCount}
                />
                
                <ClaimWrestlerButton
                  wrestlerId={wrestler.id}
                  wrestlerName={wrestler.name}
                  verificationStatus={wrestler.verification_status || 'unverified'}
                />

                {wrestler.twitter_handle && (
                  <a
                    href={`https://x.com/${wrestler.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    @{wrestler.twitter_handle}
                  </a>
                )}

                {wrestler.instagram_handle && (
                  <a
                    href={`https://instagram.com/${wrestler.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    @{wrestler.instagram_handle}
                  </a>
                )}

                {wrestler.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${wrestler.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <TikTokIcon className="w-4 h-4 mr-2" />
                    @{wrestler.tiktok_handle}
                  </a>
                )}

                {wrestler.youtube_url && (
                  <a
                    href={wrestler.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </a>
                )}

                {wrestler.website && (
                  <a
                    href={wrestler.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                )}

                {wrestler.booking_email && (
                  <a
                    href={`mailto:${wrestler.booking_email}`}
                    className="btn btn-ghost"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Booking
                  </a>
                )}

                {wrestler.merch_url && (
                  <a
                    href={wrestler.merch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Merch
                  </a>
                )}
              </div>

              {wrestler.bio && (
                <p className="text-foreground-muted max-w-2xl">
                  {wrestler.bio}
                </p>
              )}

              {wrestler.countries_wrestled && wrestler.countries_wrestled.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3" title="Countries wrestled in">
                  {wrestler.countries_wrestled.map((code: string) => (
                    <span
                      key={code}
                      className="text-2xl cursor-default"
                      title={getCountryName(code)}
                    >
                      {getFlag(code)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Championships */}
      {championships.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-wrap gap-3">
            {championships.map((champ: any) => (
              <Link
                key={champ.id}
                href={`/promotions/${champ.promotions?.slug}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border border-yellow-600/30 hover:border-yellow-500/50 transition-colors group"
              >
                <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm group-hover:text-accent transition-colors">
                    {champ.name}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {champ.promotions?.name}
                    {champ.partner && <> &middot; w/ {champ.partner.name}</>}
                    {champ.won_date && (
                      <> &middot; Since {new Date(champ.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold mb-6">
              Upcoming Events ({upcomingEvents.length})
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-accent font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(event.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{event.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {event.promotions?.name} • {event.city}, {event.state}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6 text-foreground-muted">
              Past Events ({pastEvents.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {pastEvents.slice(0, 10).map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-foreground-muted font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(event.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{event.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {event.promotions?.name} • {event.city}, {event.state}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No events */}
        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-foreground-muted">
              We don't have any events listed for {wrestler.name} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
