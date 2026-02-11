import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, ROLE_LABELS } from '@/lib/supabase'
import { Building2, MapPin, ExternalLink, Calendar, Instagram, Youtube, Facebook, Mail, ShoppingBag, Trophy, Users, User, Crown, Shield, Briefcase } from 'lucide-react'
import FollowPromotionButton from '@/components/FollowPromotionButton'
import ClaimPromotionButton from '@/components/ClaimPromotionButton'
import RosterCarousel from '@/components/RosterCarousel'
import QRCodeButton from '@/components/QRCodeButton'
import MerchGallery from '@/components/MerchGallery'
import VideoCarousel from '@/components/VideoCarousel'

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

interface PromotionPageProps {
  params: { slug: string }
}

async function getPromotion(slug: string) {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching promotion:', error)
    return null
  }

  return data
}

async function getPromotionEvents(promotionId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('promotion_id', promotionId)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching promotion events:', error)
    return []
  }

  return data
}

async function getFollowerCount(promotionId: string) {
  const { count } = await supabase
    .from('user_follows_promotion')
    .select('*', { count: 'exact', head: true })
    .eq('promotion_id', promotionId)

  return count || 0
}

async function getChampionships(promotionId: string) {
  const { data, error } = await supabase
    .from('promotion_championships')
    .select(`
      *,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url, render_url, moniker, hero_style),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url, render_url, moniker, hero_style),
      champion_group:promotion_groups!promotion_championships_champion_group_id_fkey (
        id, name, type,
        promotion_group_members (id, wrestler_id, wrestlers (id, name, slug, photo_url, render_url, moniker, hero_style))
      )
    `)
    .eq('promotion_id', promotionId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching championships:', error)
    return []
  }
  return data
}

async function getRoster(promotionId: string) {
  const { data, error } = await supabase
    .from('wrestler_promotions')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url, render_url, hometown, moniker, hero_style)
    `)
    .eq('promotion_id', promotionId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching roster:', error)
    return []
  }
  return data
}

async function getPromotionCrew(promotionId: string) {
  const { data, error } = await supabase
    .from('professional_promotions')
    .select('*, professionals (id, name, slug, photo_url, role)')
    .eq('promotion_id', promotionId)
    .eq('status', 'accepted')

  if (error) {
    console.error('Error fetching crew:', error)
    return []
  }
  return data || []
}

async function getGroups(promotionId: string) {
  const { data, error } = await supabase
    .from('promotion_groups')
    .select(`
      *,
      promotion_group_members (
        id, wrestler_id, sort_order,
        wrestlers (id, name, slug, photo_url)
      )
    `)
    .eq('promotion_id', promotionId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }
  return data
}

export async function generateMetadata({ params }: PromotionPageProps) {
  const promotion = await getPromotion(params.slug)
  
  if (!promotion) {
    return { title: 'Promotion Not Found | Hot Tag' }
  }

  return {
    title: `${promotion.name} | Hot Tag`,
    description: `Follow ${promotion.name} on Hot Tag to see their upcoming events.`,
  }
}

export default async function PromotionPage({ params }: PromotionPageProps) {
  const promotion = await getPromotion(params.slug)

  if (!promotion) {
    notFound()
  }

  const events = await getPromotionEvents(promotion.id)
  const followerCount = await getFollowerCount(promotion.id)
  const championships = await getChampionships(promotion.id)
  const roster = await getRoster(promotion.id)
  const promotionCrew = await getPromotionCrew(promotion.id)
  const groups = await getGroups(promotion.id)

  // Fetch promotion merch items
  const { data: merchItems } = await supabase
    .from('promotion_merch_items')
    .select('id, title, image_url, link_url, price')
    .eq('promotion_id', promotion.id)
    .order('sort_order', { ascending: true })

  const { data: profileVideos } = await supabase
    .from('profile_videos')
    .select('id, title, url')
    .eq('promotion_id', promotion.id)
    .order('sort_order', { ascending: true })
  
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
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {promotion.logo_url ? (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={160}
                  height={160}
                  className="object-contain w-full h-full p-2"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-background-tertiary rounded-lg flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-foreground-muted" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {promotion.name}
              </h1>
              
              {(promotion.city || promotion.state) && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-foreground-muted mb-4">
                  <MapPin className="w-4 h-4" />
                  {[promotion.city, promotion.state].filter(Boolean).join(', ')}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <FollowPromotionButton 
                  promotionId={promotion.id}
                  promotionName={promotion.name}
                  initialFollowerCount={followerCount}
                />
                <QRCodeButton url={`https://www.hottag.app/promotions/${promotion.slug}`} name={promotion.name} />

                <ClaimPromotionButton
                  promotionId={promotion.id}
                  promotionName={promotion.name}
                  verificationStatus={promotion.verification_status}
                />
                
                {promotion.twitter_handle && (
                  <a
                    href={`https://x.com/${promotion.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    @{promotion.twitter_handle}
                  </a>
                )}

                {promotion.instagram_handle && (
                  <a
                    href={`https://instagram.com/${promotion.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    @{promotion.instagram_handle}
                  </a>
                )}

                {promotion.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${promotion.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <TikTokIcon className="w-4 h-4 mr-2" />
                    @{promotion.tiktok_handle}
                  </a>
                )}

                {promotion.facebook_url && (
                  <a
                    href={promotion.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </a>
                )}

                {promotion.youtube_url && (
                  <a
                    href={promotion.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </a>
                )}

                {promotion.website && (
                  <a
                    href={promotion.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Website
                  </a>
                )}

                {promotion.booking_email && (
                  <a
                    href={`mailto:${promotion.booking_email}`}
                    className="btn btn-ghost"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                )}

                {promotion.merch_url && (
                  <a
                    href={promotion.merch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Merch
                  </a>
                )}

                {promotion.bluesky_handle && (
                  <a
                    href={`https://bsky.app/profile/${promotion.bluesky_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <BlueskyIcon className="w-4 h-4 mr-2" />
                    Bluesky
                  </a>
                )}

                {promotion.patreon_url && (
                  <a
                    href={promotion.patreon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <PatreonIcon className="w-4 h-4 mr-2" />
                    Patreon
                  </a>
                )}
              </div>

              {promotion.description && (
                <p className="text-foreground-muted max-w-2xl">
                  {promotion.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Championships & Roster */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Championships */}
        {championships.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-interested" />
              Championships
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {championships.map((champ: any) => {
                const champion = champ.current_champion
                const champion2 = champ.current_champion_2
                const champGroup = champ.champion_group
                const groupMembers = champGroup?.promotion_group_members || []
                return (
                  <div key={champ.id} className="card p-5 relative overflow-hidden">
                    {/* Gold accent top border */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
                    
                    <div className="text-sm font-semibold text-interested mb-3 flex items-center gap-1.5">
                      <Crown className="w-4 h-4" />
                      {champ.name}
                    </div>

                    {champGroup ? (
                      /* Group champion display */
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 flex-shrink-0">
                          {groupMembers.map((m: any) => (
                            <Link key={m.id} href={`/wrestlers/${m.wrestlers?.slug}`}>
                              <div className="w-14 h-14 rounded-xl bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-interested/50 hover:border-interested transition-colors">
                                {m.wrestlers?.photo_url ? (
                                  <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                                ) : (
                                  <User className="w-7 h-7 text-foreground-muted" />
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{champGroup.name}</div>
                          <div className="text-sm text-foreground-muted">
                            {groupMembers.map((m: any, i: number) => (
                              <span key={m.id}>
                                {i > 0 && (i === groupMembers.length - 1 ? ' & ' : ', ')}
                                <Link href={`/wrestlers/${m.wrestlers?.slug}`} className="hover:text-accent transition-colors">{m.wrestlers?.name}</Link>
                              </span>
                            ))}
                          </div>
                          {champ.won_date && (
                            <div className="text-xs text-foreground-muted mt-0.5">
                              Since {new Date(champ.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : champion ? (
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 flex-shrink-0">
                          <Link href={`/wrestlers/${champion.slug}`}>
                            <div className="w-16 h-16 rounded-xl bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-interested/50 hover:border-interested transition-colors relative z-10">
                              {champion.photo_url ? (
                                <Image src={champion.photo_url} alt={champion.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                              ) : (
                                <User className="w-8 h-8 text-foreground-muted" />
                              )}
                            </div>
                          </Link>
                          {champion2 && (
                            <Link href={`/wrestlers/${champion2.slug}`}>
                              <div className="w-16 h-16 rounded-xl bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-interested/50 hover:border-interested transition-colors">
                                {champion2.photo_url ? (
                                  <Image src={champion2.photo_url} alt={champion2.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                                ) : (
                                  <User className="w-8 h-8 text-foreground-muted" />
                                )}
                              </div>
                            </Link>
                          )}
                        </div>
                        <div>
                          <div>
                            <Link href={`/wrestlers/${champion.slug}`} className="font-bold text-lg hover:text-accent transition-colors">
                              {champion.name}
                            </Link>
                            {champion2 && (
                              <><span className="text-foreground-muted"> &amp; </span><Link href={`/wrestlers/${champion2.slug}`} className="font-bold text-lg hover:text-accent transition-colors">{champion2.name}</Link></>
                            )}
                          </div>
                          {champ.won_date && (
                            <div className="text-xs text-foreground-muted mt-0.5">
                              Since {new Date(champ.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-foreground-muted">
                        <div className="w-16 h-16 rounded-xl bg-background-tertiary flex items-center justify-center border-2 border-dashed border-border">
                          <Trophy className="w-6 h-6 text-foreground-muted/30" />
                        </div>
                        <span className="text-sm italic">Vacant</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Roster */}
        {roster.length > 0 && (
          <RosterCarousel roster={roster} />
        )}

        {/* Crew */}
        {promotionCrew.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-400" />
              Crew
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {promotionCrew.map((pc: any) => (
                <Link
                  key={pc.id}
                  href={`/crew/${pc.professionals.slug}`}
                  className="flex flex-col items-center p-3 rounded-lg bg-background-tertiary hover:bg-border transition-colors group"
                >
                  <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center overflow-hidden mb-2">
                    {pc.professionals.photo_url ? (
                      <Image src={pc.professionals.photo_url} alt={pc.professionals.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <Briefcase className="w-8 h-8 text-foreground-muted" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2 w-full">
                    {pc.professionals.name}
                  </span>
                  <span className="text-[10px] text-purple-400 mt-0.5 text-center line-clamp-1 w-full">
                    {pc.professionals.role?.map((r: string) => ROLE_LABELS[r] || r).join(' / ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tag Teams & Factions */}
        {groups.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-400" />
              Tag Teams &amp; Factions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group: any) => {
                const members = group.promotion_group_members || []
                const typeLabel = group.type === 'tag_team' ? 'Tag Team' : group.type === 'trio' ? 'Trio' : 'Faction'
                const typeColor = group.type === 'tag_team' ? 'text-blue-400 bg-blue-500/10' : group.type === 'trio' ? 'text-purple-400 bg-purple-500/10' : 'text-green-400 bg-green-500/10'
                return (
                  <div key={group.id} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-lg">{group.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {members.map((m: any) => (
                        <Link key={m.id} href={`/wrestlers/${m.wrestlers?.slug}`} className="flex flex-col items-center group">
                          <div className="w-14 h-14 rounded-xl bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-accent transition-colors">
                            {m.wrestlers?.photo_url ? (
                              <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                            ) : (
                              <User className="w-7 h-7 text-foreground-muted" />
                            )}
                          </div>
                          <span className="text-xs mt-1 text-center group-hover:text-accent transition-colors max-w-[70px] truncate">{m.wrestlers?.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Videos */}
        {profileVideos && profileVideos.length > 0 && (
          <div className="mb-10">
            <div className="max-w-3xl">
              <VideoCarousel videos={profileVideos} sectionTitle={promotion.video_section_title} />
            </div>
          </div>
        )}

        {/* Merch Gallery */}
        {merchItems && merchItems.length > 0 && (
          <div className="mb-10">
            <MerchGallery items={merchItems} />
          </div>
        )}

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
                      {[event.city?.replace(/,$/, ''), event.state, event.country !== 'United States' && event.country !== 'USA' ? event.country : null].filter(Boolean).join(', ')}
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
                      {[event.city?.replace(/,$/, ''), event.state, event.country !== 'United States' && event.country !== 'USA' ? event.country : null].filter(Boolean).join(', ')}
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
              We don't have any events listed for {promotion.name} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
