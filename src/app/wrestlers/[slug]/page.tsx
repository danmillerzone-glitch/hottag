import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Calendar, ExternalLink, Trophy, Instagram, Youtube, Globe, Mail, ShoppingBag, Home, Ruler, Dumbbell, Cake, GraduationCap, Shield, Zap } from 'lucide-react'
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

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.178 3.238-4.596.55-8.626 2.04-3.39 7.205 5.42 4.244 7.108-1.012 8.588-4.65.134-.33.221-.547.288-.547.066 0 .154.218.288.547 1.48 3.638 3.168 8.894 8.588 4.65 5.236-5.165 1.206-6.655-3.39-7.205 2.578.238 5.393-.611 6.178-3.238.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  )
}

function PatreonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z" />
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

  // Championships held via a group this wrestler belongs to
  const { data: groupMemberships } = await supabase
    .from('promotion_group_members')
    .select('group_id')
    .eq('wrestler_id', wrestlerId)

  let groupChampionships: any[] = []
  if (groupMemberships && groupMemberships.length > 0) {
    const groupIds = groupMemberships.map((m: any) => m.group_id)
    const { data: groupChamps } = await supabase
      .from('promotion_championships')
      .select(`
        id, name, short_name, won_date, is_active,
        champion_group:promotion_groups!promotion_championships_champion_group_id_fkey (
          id, name, type,
          promotion_group_members (id, wrestler_id, wrestlers (id, name, slug))
        ),
        promotions (id, name, slug, logo_url)
      `)
      .in('champion_group_id', groupIds)
      .eq('is_active', true)

    groupChampionships = (groupChamps || []).map((c: any) => ({
      ...c,
      isGroupChampionship: true,
      groupName: c.champion_group?.name,
      partners: (c.champion_group?.promotion_group_members || [])
        .filter((m: any) => m.wrestler_id !== wrestlerId)
        .map((m: any) => m.wrestlers),
    }))
  }

  const championships = [
    ...(asChamp1 || []).map((c: any) => ({ ...c, partner: c.current_champion_2 })),
    ...(asChamp2 || []).map((c: any) => ({ ...c, partner: c.current_champion })),
    ...groupChampionships,
  ]

  return championships
}

async function getWrestlerGroups(wrestlerId: string) {
  const { data, error } = await supabase
    .from('promotion_group_members')
    .select(`
      id,
      promotion_groups (
        id, name, type, is_active,
        promotions (id, name, slug, logo_url),
        promotion_group_members (
          id, wrestler_id,
          wrestlers (id, name, slug, photo_url)
        )
      )
    `)
    .eq('wrestler_id', wrestlerId)

  if (error) {
    console.error('Error fetching wrestler groups:', error)
    return []
  }

  // Filter to active groups and extract
  return (data || [])
    .map((d: any) => d.promotion_groups)
    .filter((g: any) => g && g.is_active)
}

export async function generateMetadata({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)
  
  if (!wrestler) {
    return { title: 'Wrestler Not Found | Hot Tag' }
  }

  return {
    title: `${wrestler.name} | Hot Tag`,
    description: `Follow ${wrestler.name} on Hot Tag to see their upcoming events.`,
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
  const groups = await getWrestlerGroups(wrestler.id)
  
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
                  unoptimized
                />
              ) : (
                <User className="w-16 h-16 text-foreground-muted" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {wrestler.name}
                </h1>
                {wrestler.pwi_ranking && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold">
                    PWI #{wrestler.pwi_ranking}
                  </span>
                )}
              </div>

              {wrestler.moniker && (
                <p className="text-lg text-accent italic mb-2">&ldquo;{wrestler.moniker}&rdquo;</p>
              )}
              
              {(wrestler.residence || wrestler.birthplace || wrestler.hometown) && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-foreground-muted mb-3">
                  {(wrestler.residence || wrestler.hometown) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{wrestler.residence || wrestler.hometown}</span>
                    </div>
                  )}
                  {wrestler.birthplace && (
                    <div className="flex items-center gap-1.5">
                      <Home className="w-4 h-4" />
                      <span className="text-sm">From {wrestler.birthplace}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick stats */}
              {(wrestler.height || wrestler.weight || wrestler.debut_year || wrestler.birthday || wrestler.trainer) && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-foreground-muted mb-4">
                  {wrestler.height && (
                    <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {wrestler.height}</span>
                  )}
                  {wrestler.weight && (
                    <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {wrestler.weight}</span>
                  )}
                  {wrestler.birthday && (
                    <span className="flex items-center gap-1"><Cake className="w-3.5 h-3.5" /> {new Date(wrestler.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  )}
                  {wrestler.debut_year && (
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Debut {wrestler.debut_year}</span>
                  )}
                  {wrestler.trainer && (
                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Trained by {wrestler.trainer}</span>
                  )}
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

                {wrestler.bluesky_handle && (
                  <a
                    href={`https://bsky.app/profile/${wrestler.bluesky_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <BlueskyIcon className="w-4 h-4 mr-2" />
                    Bluesky
                  </a>
                )}

                {wrestler.patreon_url && (
                  <a
                    href={wrestler.patreon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <PatreonIcon className="w-4 h-4 mr-2" />
                    Patreon
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

              {wrestler.signature_moves && wrestler.signature_moves.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted mb-2">
                    <Zap className="w-3.5 h-3.5" /> Signature Moves
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wrestler.signature_moves.map((move: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
                        {move}
                      </span>
                    ))}
                  </div>
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border-2 border-yellow-500/60 hover:border-yellow-400 transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm group-hover:text-accent transition-colors">
                    {champ.name}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {champ.promotions?.name}
                    {champ.partner && <> &middot; w/ {champ.partner.name}</>}
                    {champ.isGroupChampionship && champ.groupName && <> &middot; {champ.groupName}</>}
                    {champ.partners && champ.partners.length > 0 && !champ.partner && (
                      <> &middot; w/ {champ.partners.map((p: any) => p.name).join(' & ')}</>
                    )}
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

      {/* Tag Teams & Factions */}
      {groups.length > 0 && (() => {
        // Deduplicate groups by name — merge promotions for same-named groups
        const uniqueGroups = new Map<string, { group: any; promotions: string[]; members: any[] }>()
        groups.forEach((group: any) => {
          const key = group.name.toLowerCase()
          const members = (group.promotion_group_members || []).filter((m: any) => m.wrestler_id !== wrestler.id)
          if (uniqueGroups.has(key)) {
            const existing = uniqueGroups.get(key)!
            if (group.promotions?.name && !existing.promotions.includes(group.promotions.name)) {
              existing.promotions.push(group.promotions.name)
            }
          } else {
            uniqueGroups.set(key, {
              group,
              promotions: group.promotions?.name ? [group.promotions.name] : [],
              members,
            })
          }
        })
        return (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex flex-wrap gap-3">
              {Array.from(uniqueGroups.values()).map(({ group, promotions, members }) => {
                const typeLabel = group.type === 'tag_team' ? 'Tag Team' : group.type === 'trio' ? 'Trio' : 'Faction'
                const typeColor = group.type === 'tag_team' ? 'border-blue-500/30 hover:border-blue-500/50' : group.type === 'trio' ? 'border-purple-500/30 hover:border-purple-500/50' : 'border-green-500/30 hover:border-green-500/50'
                const iconColor = group.type === 'tag_team' ? 'text-blue-400' : group.type === 'trio' ? 'text-purple-400' : 'text-green-400'
                return (
                  <div key={group.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border ${typeColor} transition-colors`}>
                    <Shield className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{group.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${group.type === 'tag_team' ? 'text-blue-400 bg-blue-500/10' : group.type === 'trio' ? 'text-purple-400 bg-purple-500/10' : 'text-green-400 bg-green-500/10'}`}>{typeLabel}</span>
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {promotions.length > 0 && <>{promotions.join(', ')} &middot; </>}
                        w/ {members.map((m: any, i: number) => (
                          <span key={m.id}>
                            {i > 0 && (i === members.length - 1 ? ' & ' : ', ')}
                            <Link href={`/wrestlers/${m.wrestlers?.slug}`} className="hover:text-accent transition-colors">{m.wrestlers?.name}</Link>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex -space-x-2 ml-auto">
                      {members.slice(0, 4).map((m: any) => (
                        <Link key={m.id} href={`/wrestlers/${m.wrestlers?.slug}`}>
                          <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-background-secondary hover:border-accent transition-colors">
                            {m.wrestlers?.photo_url ? (
                              <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                            ) : (
                              <User className="w-4 h-4 text-foreground-muted" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

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
