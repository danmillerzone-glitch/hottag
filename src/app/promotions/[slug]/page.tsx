import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Building2, MapPin, ExternalLink, Calendar, Instagram, Youtube, Facebook, Mail, ShoppingBag, Trophy, Users, User, Crown } from 'lucide-react'
import FollowPromotionButton from '@/components/FollowPromotionButton'
import ClaimPromotionButton from '@/components/ClaimPromotionButton'

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
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
      wrestlers (id, name, slug, photo_url, hometown)
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

export async function generateMetadata({ params }: PromotionPageProps) {
  const promotion = await getPromotion(params.slug)
  
  if (!promotion) {
    return { title: 'Promotion Not Found | HotTag' }
  }

  return {
    title: `${promotion.name} | HotTag`,
    description: `Follow ${promotion.name} on HotTag to see their upcoming events.`,
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
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
              {promotion.logo_url ? (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={160}
                  height={160}
                  className="object-contain w-full h-full p-2"
                />
              ) : (
                <Building2 className="w-16 h-16 text-foreground-muted" />
              )}
            </div>

            {/* Info */}
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
                return (
                  <div key={champ.id} className="card p-5 relative overflow-hidden">
                    {/* Gold accent top border */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
                    
                    <div className="text-sm font-semibold text-interested mb-3 flex items-center gap-1.5">
                      <Crown className="w-4 h-4" />
                      {champ.name}
                    </div>

                    {champion ? (
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 flex-shrink-0">
                          <Link href={`/wrestlers/${champion.slug}`}>
                            <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-interested/50 hover:border-interested transition-colors relative z-10">
                              {champion.photo_url ? (
                                <Image src={champion.photo_url} alt={champion.name} width={64} height={64} className="object-cover w-full h-full" />
                              ) : (
                                <User className="w-8 h-8 text-foreground-muted" />
                              )}
                            </div>
                          </Link>
                          {champion2 && (
                            <Link href={`/wrestlers/${champion2.slug}`}>
                              <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-interested/50 hover:border-interested transition-colors">
                                {champion2.photo_url ? (
                                  <Image src={champion2.photo_url} alt={champion2.name} width={64} height={64} className="object-cover w-full h-full" />
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
                              <span className="text-foreground-muted"> &amp; <Link href={`/wrestlers/${champion2.slug}`} className="font-bold text-lg hover:text-accent transition-colors">{champion2.name}</Link></span>
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
                        <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center border-2 border-dashed border-border">
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
          <div className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-accent" />
              Roster ({roster.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {roster.map((member: any) => (
                <Link
                  key={member.id}
                  href={`/wrestlers/${member.wrestlers.slug}`}
                  className="flex flex-col items-center p-3 rounded-lg bg-background-tertiary hover:bg-border transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden mb-2 border-2 border-transparent group-hover:border-accent transition-colors">
                    {member.wrestlers.photo_url ? (
                      <Image
                        src={member.wrestlers.photo_url}
                        alt={member.wrestlers.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-foreground-muted" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2">
                    {member.wrestlers.name}
                  </span>
                </Link>
              ))}
            </div>
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
                      {event.city}, {event.state}
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
                      {event.city}, {event.state}
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
