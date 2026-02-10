import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Calendar, ExternalLink, Trophy, Instagram, Youtube, Globe, Mail, ShoppingBag, Home, Ruler, Dumbbell, Cake, GraduationCap, Shield, Zap } from 'lucide-react'
import { formatEventDateFull } from '@/lib/utils'
import { getFlag, getCountryName } from '@/lib/countries'
import FollowWrestlerButton from '@/components/FollowWrestlerButton'
import ClaimWrestlerButton from '@/components/ClaimWrestlerButton'
import ShareButton from '@/components/ShareButton'
import QRCodeButton from '@/components/QRCodeButton'
import VideoCarousel from '@/components/VideoCarousel'
import MerchGallery from '@/components/MerchGallery'
import { getHeroCSS } from '@/lib/hero-themes'

function XIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>)
}
function TikTokIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.65a8.35 8.35 0 0 0 4.76 1.49V6.69h-1z" /></svg>)
}
function BlueskyIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.178 3.238-4.596.55-8.626 2.04-3.39 7.205 5.42 4.244 7.108-1.012 8.588-4.65.134-.33.221-.547.288-.547.066 0 .154.218.288.547 1.48 3.638 3.168 8.894 8.588 4.65 5.236-5.165 1.206-6.655-3.39-7.205 2.578.238 5.393-.611 6.178-3.238.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" /></svg>)
}
function PatreonIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z" /></svg>)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WrestlerPageProps { params: { slug: string } }

async function getWrestler(slug: string) {
  const { data } = await supabase.from('wrestlers').select('*').eq('slug', slug).single()
  return data
}

async function getWrestlerEvents(wrestlerId: string) {
  const { data: ewData } = await supabase.from('event_wrestlers').select(`events (id, name, slug, event_date, city, state, country, promotions ( name, slug ))`).eq('wrestler_id', wrestlerId)
  const { data: mpData } = await supabase.from('match_participants').select(`event_matches (events (id, name, slug, event_date, city, state, country, promotions ( name, slug )))`).eq('wrestler_id', wrestlerId)
  const { data: atData } = await supabase.from('event_announced_talent').select(`events (id, name, slug, event_date, city, state, country, promotions ( name, slug ))`).eq('wrestler_id', wrestlerId)
  const eventMap = new Map<string, any>()
  for (const d of (ewData || [])) { const evt = (d as any).events; if (evt) eventMap.set(evt.id, evt) }
  for (const d of (mpData || [])) { const evt = (d as any).event_matches?.events; if (evt) eventMap.set(evt.id, evt) }
  for (const d of (atData || [])) { const evt = (d as any).events; if (evt) eventMap.set(evt.id, evt) }
  return Array.from(eventMap.values()).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
}

async function getFollowerCount(wrestlerId: string) {
  const { count } = await supabase.from('user_follows_wrestler').select('*', { count: 'exact', head: true }).eq('wrestler_id', wrestlerId)
  return count || 0
}

async function getWrestlerChampionships(wrestlerId: string) {
  const { data: asChamp1 } = await supabase.from('promotion_championships').select(`id, name, short_name, won_date, is_active, current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug), promotions (id, name, slug, logo_url)`).eq('current_champion_id', wrestlerId).eq('is_active', true)
  const { data: asChamp2 } = await supabase.from('promotion_championships').select(`id, name, short_name, won_date, is_active, current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug), promotions (id, name, slug, logo_url)`).eq('current_champion_2_id', wrestlerId).eq('is_active', true)
  const { data: groupMemberships } = await supabase.from('promotion_group_members').select('group_id').eq('wrestler_id', wrestlerId)
  let groupChampionships: any[] = []
  if (groupMemberships && groupMemberships.length > 0) {
    const groupIds = groupMemberships.map((m: any) => m.group_id)
    const { data: groupChamps } = await supabase.from('promotion_championships').select(`id, name, short_name, won_date, is_active, champion_group:promotion_groups!promotion_championships_champion_group_id_fkey (id, name, type, promotion_group_members (id, wrestler_id, wrestlers (id, name, slug))), promotions (id, name, slug, logo_url)`).in('champion_group_id', groupIds).eq('is_active', true)
    groupChampionships = (groupChamps || []).map((c: any) => ({ ...c, isGroupChampionship: true, groupName: c.champion_group?.name, partners: (c.champion_group?.promotion_group_members || []).filter((m: any) => m.wrestler_id !== wrestlerId).map((m: any) => m.wrestlers) }))
  }
  return [
    ...(asChamp1 || []).map((c: any) => ({ ...c, partner: c.current_champion_2 })),
    ...(asChamp2 || []).map((c: any) => ({ ...c, partner: c.current_champion })),
    ...groupChampionships,
  ]
}

async function getWrestlerGroups(wrestlerId: string) {
  const { data } = await supabase.from('promotion_group_members').select(`id, promotion_groups (id, name, type, is_active, promotions (id, name, slug, logo_url), promotion_group_members (id, wrestler_id, wrestlers (id, name, slug, photo_url)))`).eq('wrestler_id', wrestlerId)
  return (data || []).map((d: any) => d.promotion_groups).filter((g: any) => g && g.is_active)
}

async function getWrestlerPromotions(wrestlerId: string) {
  const promoMap = new Map<string, any>()

  // 1. From roster (wrestler_promotions)
  const { data: rosterData } = await supabase
    .from('wrestler_promotions')
    .select('promotions ( id, name, slug, logo_url )')
    .eq('wrestler_id', wrestlerId)
    .eq('is_active', true)
  for (const d of (rosterData || [])) {
    const p = (d as any).promotions
    if (p?.id && p?.logo_url) promoMap.set(p.id, p)
  }

  // 2. From events (event_wrestlers)
  const { data: ewData } = await supabase
    .from('event_wrestlers')
    .select('events ( promotion_id, promotions ( id, name, slug, logo_url ) )')
    .eq('wrestler_id', wrestlerId)
  for (const d of (ewData || [])) {
    const p = (d as any).events?.promotions
    if (p?.id && p?.logo_url) promoMap.set(p.id, p)
  }

  // 3. From announced talent
  const { data: atData } = await supabase
    .from('event_announced_talent')
    .select('events ( promotion_id, promotions ( id, name, slug, logo_url ) )')
    .eq('wrestler_id', wrestlerId)
  for (const d of (atData || [])) {
    const p = (d as any).events?.promotions
    if (p?.id && p?.logo_url) promoMap.set(p.id, p)
  }

  return Array.from(promoMap.values())
}

export async function generateMetadata({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)
  if (!wrestler) return { title: 'Wrestler Not Found | Hot Tag' }
  return {
    title: `${wrestler.name} | Hot Tag`,
    description: `Follow ${wrestler.name} on Hot Tag to see their upcoming events.`,
    openGraph: { title: `${wrestler.name} | Hot Tag`, images: wrestler.render_url || wrestler.photo_url ? [wrestler.render_url || wrestler.photo_url] : undefined },
  }
}

export default async function WrestlerPage({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)
  if (!wrestler) notFound()

  const events = await getWrestlerEvents(wrestler.id)
  const followerCount = await getFollowerCount(wrestler.id)
  const championships = await getWrestlerChampionships(wrestler.id)
  const groups = await getWrestlerGroups(wrestler.id)
  const wrestlerPromotions = await getWrestlerPromotions(wrestler.id)

  // Fetch merch items
  const { data: merchItems } = await supabase
    .from('wrestler_merch_items')
    .select('id, title, image_url, link_url, price')
    .eq('wrestler_id', wrestler.id)
    .order('sort_order', { ascending: true })

  const { data: profileVideos } = await supabase
    .from('profile_videos')
    .select('id, title, url')
    .eq('wrestler_id', wrestler.id)
    .order('sort_order', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = events.filter((e: any) => e.event_date >= today)
  const pastEvents = events.filter((e: any) => e.event_date < today)

  const hasRender = !!wrestler.render_url
  const hasPhoto = !!wrestler.photo_url

  // Social link icons for hero
  const socialIcons = [
    wrestler.twitter_handle && { href: `https://x.com/${wrestler.twitter_handle}`, icon: XIcon },
    wrestler.instagram_handle && { href: `https://instagram.com/${wrestler.instagram_handle}`, icon: Instagram },
    wrestler.tiktok_handle && { href: `https://tiktok.com/@${wrestler.tiktok_handle}`, icon: TikTokIcon },
    wrestler.youtube_url && { href: wrestler.youtube_url, icon: Youtube },
    wrestler.bluesky_handle && { href: `https://bsky.app/profile/${wrestler.bluesky_handle}`, icon: BlueskyIcon },
    wrestler.website && { href: wrestler.website, icon: Globe },
    wrestler.booking_email && { href: `mailto:${wrestler.booking_email}`, icon: Mail },
    wrestler.merch_url && { href: wrestler.merch_url, icon: ShoppingBag },
    wrestler.patreon_url && { href: wrestler.patreon_url, icon: PatreonIcon },
  ].filter(Boolean) as { href: string; icon: any }[]

  // Compute hero background from wrestler's theme
  const heroCSS = getHeroCSS(wrestler.hero_style || null)
  const hasTheme = !!wrestler.hero_style

  return (
    <div className="min-h-screen">
      {/* ======================================== */}
      {/* HERO */}
      {/* ======================================== */}
      <div className="relative overflow-hidden bg-background-secondary">
        {/* Diagonal texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 8px)',
        }} />

        {/* Bottom fade gradient — overlays render image to mask cutoff */}
        <div className="absolute bottom-0 left-0 right-0 h-48 z-[3] pointer-events-none" style={{
          background: 'linear-gradient(to top, #1c2228 0%, #1c2228 10%, #1c222890 50%, transparent 100%)',
        }} />

        {/* ===== DESKTOP HERO ===== */}
        <div className="hidden md:block relative">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="relative flex items-end min-h-[440px] lg:min-h-[520px] py-8">
              {/* Left: Text content */}
              <div className="flex-1 z-[5] pb-4">
                {/* PWI Badge */}
                {wrestler.pwi_ranking && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold mb-3">
                    PWI #{wrestler.pwi_ranking}
                  </span>
                )}

                {wrestler.moniker && (
                  <p className="text-lg text-accent font-bold italic mb-1">&ldquo;{wrestler.moniker}&rdquo;</p>
                )}

                {/* Name */}
                <h1 className="text-5xl lg:text-7xl font-display font-black uppercase leading-[0.9] tracking-tight mb-4">
                  {wrestler.name}
                </h1>

                {/* Follow + Social row */}
                <div className="flex items-center gap-3 mb-5">
                  <FollowWrestlerButton wrestlerId={wrestler.id} wrestlerName={wrestler.name} initialFollowerCount={followerCount} />
                  <ShareButton
                    title={`${wrestler.name} | Hot Tag`}
                    text={`Check out ${wrestler.name} on Hot Tag`}
                    url={`https://www.hottag.app/wrestlers/${wrestler.slug}`}
                  />
                  <div className="flex items-center gap-1">
                    <QRCodeButton url={`https://www.hottag.app/wrestlers/${wrestler.slug}`} name={wrestler.name} />
                    {socialIcons.map((link, i) => (
                      <a key={i} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
                        className="p-2 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors">
                        <link.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Signature Moves */}
                {wrestler.signature_moves && wrestler.signature_moves.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {wrestler.signature_moves.map((move: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
                        {move}
                      </span>
                    ))}
                  </div>
                )}

                {/* Countries Wrestled (no label) */}
                {wrestler.countries_wrestled && wrestler.countries_wrestled.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {wrestler.countries_wrestled.map((code: string) => (
                      <span key={code} className="text-2xl cursor-default" title={getCountryName(code)}>{getFlag(code)}</span>
                    ))}
                  </div>
                )}

                {/* Verified badge */}
                {wrestler.verification_status === 'verified' && (
                  <ClaimWrestlerButton wrestlerId={wrestler.id} wrestlerName={wrestler.name} verificationStatus="verified" />
                )}
              </div>

              {/* Right: Wrestler render image */}
              <div className="flex-shrink-0 relative w-[420px] lg:w-[540px] h-[500px] lg:h-[580px] z-[2] translate-y-8">
                {/* Theme backdrop — soft glow behind the render */}
                {hasTheme && (
                  <div className="absolute -inset-12 -right-48 overflow-visible" style={{
                    maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 25%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 25%, transparent 70%)',
                  }}>
                    {wrestler.hero_style?.type === 'flag' ? (
                      <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${wrestler.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ background: heroCSS.background, opacity: 0.6 }} />
                        {heroCSS.texture && (
                          <div className="absolute inset-0" style={{ background: heroCSS.texture, opacity: 0.4 }} />
                        )}
                      </>
                    )}
                  </div>
                )}
                {hasRender ? (
                  <Image src={wrestler.render_url!} alt={wrestler.name} fill className="object-contain object-bottom relative z-[1]" priority unoptimized />
                ) : hasPhoto ? (
                  <div className="absolute bottom-0 right-8 w-[260px] lg:w-[300px] h-[260px] lg:h-[300px]">
                    <div className="w-full h-full rounded-2xl bg-background-tertiary overflow-hidden border-2 border-border">
                      <Image src={wrestler.photo_url!} alt={wrestler.name} fill className="object-cover" priority unoptimized />
                    </div>
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-8 w-[200px] h-[200px] rounded-2xl bg-background-tertiary flex items-center justify-center border-2 border-border">
                    <User className="w-24 h-24 text-foreground-muted/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE HERO — Trading Card ===== */}
        <div className="md:hidden relative px-4 pt-6 pb-8 z-[5]">
          <div className="relative mx-auto max-w-sm">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-background-tertiary to-background-secondary border border-border/50">
              {/* Image */}
              <div className="relative h-72 flex items-end justify-center overflow-hidden">
                {/* Theme backdrop for mobile */}
                {hasTheme && (
                  <div className="absolute inset-0 z-[0]">
                    {wrestler.hero_style?.type === 'flag' ? (
                      <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${wrestler.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ background: heroCSS.background }} />
                        {heroCSS.texture && (
                          <div className="absolute inset-0" style={{ background: heroCSS.texture }} />
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-transparent z-[1]" />
                {hasRender ? (
                  <Image src={wrestler.render_url!} alt={wrestler.name} fill className="object-contain object-bottom" priority unoptimized />
                ) : hasPhoto ? (
                  <Image src={wrestler.photo_url!} alt={wrestler.name} fill className="object-cover" priority unoptimized />
                ) : (
                  <div className="flex items-center justify-center w-full h-full"><User className="w-24 h-24 text-foreground-muted/20" /></div>
                )}
              </div>

              {/* Card content */}
              <div className="relative z-[2] -mt-16 px-5 pb-5">
                {/* PWI Badge */}
                {wrestler.pwi_ranking && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                    PWI #{wrestler.pwi_ranking}
                  </span>
                )}

                {wrestler.moniker && (
                  <p className="text-sm text-accent font-bold italic mb-1">&ldquo;{wrestler.moniker}&rdquo;</p>
                )}

                <h1 className="text-3xl font-display font-black uppercase leading-[0.9] tracking-tight mb-3">
                  {wrestler.name}
                </h1>

                {/* Follow + Share */}
                <div className="flex items-center gap-2 mb-2 border-t border-border/50 pt-3">
                  <FollowWrestlerButton wrestlerId={wrestler.id} wrestlerName={wrestler.name} initialFollowerCount={followerCount} />
                  <ShareButton
                    title={`${wrestler.name} | Hot Tag`}
                    text={`Check out ${wrestler.name} on Hot Tag`}
                    url={`https://www.hottag.app/wrestlers/${wrestler.slug}`}
                  />
                </div>

                {/* Social icons + QR — own row on mobile */}
                {(socialIcons.length > 0 || true) && (
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    <QRCodeButton url={`https://www.hottag.app/wrestlers/${wrestler.slug}`} name={wrestler.name} />
                    {socialIcons.map((link, i) => (
                      <a key={i} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
                        className="p-2 rounded-lg text-foreground-muted hover:text-accent transition-colors">
                        <link.icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {(wrestler.height || wrestler.weight || wrestler.birthday || wrestler.birthplace || wrestler.residence) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted mb-3 border-t border-border/50 pt-3">
                    {wrestler.height && (
                      <div><span className="uppercase tracking-wider text-foreground-muted/50 text-[10px]">Height</span><div className="font-bold text-foreground text-sm">{wrestler.height}</div></div>
                    )}
                    {wrestler.weight && (
                      <div><span className="uppercase tracking-wider text-foreground-muted/50 text-[10px]">Weight</span><div className="font-bold text-foreground text-sm">{wrestler.weight}</div></div>
                    )}
                    {wrestler.birthday && (
                      <div><span className="uppercase tracking-wider text-foreground-muted/50 text-[10px]">Born</span><div className="font-bold text-foreground text-sm">{new Date(wrestler.birthday + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</div></div>
                    )}
                    {(wrestler.birthplace || wrestler.hometown) && (
                      <div><span className="uppercase tracking-wider text-foreground-muted/50 text-[10px]">From</span><div className="font-bold text-foreground text-sm">{wrestler.birthplace || wrestler.hometown}</div></div>
                    )}
                    {wrestler.residence && (
                      <div><span className="uppercase tracking-wider text-foreground-muted/50 text-[10px]">Resides</span><div className="font-bold text-foreground text-sm">{wrestler.residence}</div></div>
                    )}
                  </div>
                )}

                {/* Signature moves */}
                {wrestler.signature_moves && wrestler.signature_moves.length > 0 && (
                  <div className="border-t border-border/50 pt-3 mb-3">
                    <div className="text-sm font-bold text-foreground">{wrestler.signature_moves.join(', ')}</div>
                  </div>
                )}

                {/* Countries (no label) */}
                {wrestler.countries_wrestled && wrestler.countries_wrestled.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {wrestler.countries_wrestled.map((code: string) => (
                      <span key={code} className="text-xl cursor-default" title={getCountryName(code)}>{getFlag(code)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* PROMOTION LOGOS BAR — below hero */}
      {/* ======================================== */}
      {wrestlerPromotions.length > 0 && (
        <div className="border-b border-border bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4 overflow-x-auto">
              {wrestlerPromotions.map((promo: any) => (
                <Link key={promo.id} href={`/promotions/${promo.slug}`} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity" title={promo.name}>
                  <Image src={promo.logo_url} alt={promo.name} width={36} height={36} className="object-contain" unoptimized />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* DETAILS SECTION */}
      {/* ======================================== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Desktop: Stats + Bio row */}
        <div className="hidden md:block py-8">
          <div className="flex gap-8">
            {/* Left: Stats card */}
            <div className="w-72 flex-shrink-0">
              <div className="card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted mb-4">{wrestler.name}</h2>
                <div className="space-y-3">
                  {wrestler.height && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Height</span>
                      <span className="font-bold text-sm">{wrestler.height}</span>
                    </div>
                  )}
                  {wrestler.weight && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Weight</span>
                      <span className="font-bold text-sm">{wrestler.weight}</span>
                    </div>
                  )}
                  {wrestler.birthday && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Born</span>
                      <span className="font-bold text-sm">{new Date(wrestler.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {(wrestler.birthplace || wrestler.hometown) && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">From</span>
                      <span className="font-bold text-sm">{wrestler.birthplace || wrestler.hometown}</span>
                    </div>
                  )}
                  {wrestler.residence && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Resides</span>
                      <span className="font-bold text-sm">{wrestler.residence}</span>
                    </div>
                  )}
                  {wrestler.debut_year && (
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Debut</span>
                      <span className="font-bold text-sm">{wrestler.debut_year}</span>
                    </div>
                  )}
                  {wrestler.trainer && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted">Trainer</span>
                      <span className="font-bold text-sm">{wrestler.trainer}</span>
                    </div>
                  )}
                </div>

                {/* Claim / Verify */}
                {wrestler.verification_status !== 'verified' && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <ClaimWrestlerButton wrestlerId={wrestler.id} wrestlerName={wrestler.name} verificationStatus={wrestler.verification_status || 'unverified'} />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Bio + Championships + Groups */}
            <div className="flex-1 min-w-0">
              {wrestler.bio && (
                <div className="mb-6">
                  <p className="text-foreground-muted leading-relaxed whitespace-pre-wrap">{wrestler.bio}</p>
                </div>
              )}

              {/* Championships */}
              {championships.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-display font-bold mb-3">Championships</h2>
                  <div className="flex flex-wrap gap-3">
                    {championships.map((champ: any) => (
                      <Link key={champ.id} href={`/promotions/${champ.promotions?.slug}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border-2 border-yellow-500/60 hover:border-yellow-400 transition-colors group">
                        <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm group-hover:text-accent transition-colors">{champ.name}</div>
                          <div className="text-xs text-foreground-muted">
                            {champ.promotions?.name}
                            {champ.partner && <> &middot; w/ {champ.partner.name}</>}
                            {champ.isGroupChampionship && champ.groupName && <> &middot; {champ.groupName}</>}
                            {champ.partners && champ.partners.length > 0 && !champ.partner && (<> &middot; w/ {champ.partners.map((p: any) => p.name).join(' & ')}</>)}
                            {champ.won_date && (<> &middot; Since {new Date(champ.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Teams & Factions */}
              {groups.length > 0 && (() => {
                const uniqueGroups = new Map<string, { group: any; promotions: string[]; members: any[] }>()
                groups.forEach((group: any) => {
                  const key = group.name.toLowerCase()
                  const members = (group.promotion_group_members || []).filter((m: any) => m.wrestler_id !== wrestler.id)
                  if (uniqueGroups.has(key)) {
                    const existing = uniqueGroups.get(key)!
                    if (group.promotions?.name && !existing.promotions.includes(group.promotions.name)) existing.promotions.push(group.promotions.name)
                  } else {
                    uniqueGroups.set(key, { group, promotions: group.promotions?.name ? [group.promotions.name] : [], members })
                  }
                })
                return (
                  <div className="mb-6">
                    <h2 className="text-lg font-display font-bold mb-3">Teams &amp; Factions</h2>
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
                                  <span key={m.id}>{i > 0 && (i === members.length - 1 ? ' & ' : ', ')}<Link href={`/wrestlers/${m.wrestlers?.slug}`} className="hover:text-accent transition-colors">{m.wrestlers?.name}</Link></span>
                                ))}
                              </div>
                            </div>
                            <div className="flex -space-x-2 ml-auto">
                              {members.slice(0, 4).map((m: any) => (
                                <Link key={m.id} href={`/wrestlers/${m.wrestlers?.slug}`}>
                                  <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden border-2 border-background-secondary hover:border-accent transition-colors">
                                    {m.wrestlers?.photo_url ? (
                                      <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                                    ) : (<User className="w-4 h-4 text-foreground-muted" />)}
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

              {/* Videos */}
              {profileVideos && profileVideos.length > 0 && (
                <div className="mb-6">
                  <VideoCarousel videos={profileVideos} sectionTitle={wrestler.video_section_title} />
                </div>
              )}

              {/* Merch Gallery */}
              {merchItems && merchItems.length > 0 && (
                <div className="mb-6">
                  <MerchGallery items={merchItems} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Bio + Championships below card */}
        <div className="md:hidden py-6 space-y-6">
          {wrestler.bio && (
            <p className="text-foreground-muted text-sm leading-relaxed whitespace-pre-wrap">{wrestler.bio}</p>
          )}
          {championships.length > 0 && (
            <div>
              <h2 className="text-lg font-display font-bold mb-3">Championships</h2>
              <div className="space-y-2">
                {championships.map((champ: any) => (
                  <Link key={champ.id} href={`/promotions/${champ.promotions?.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border-2 border-yellow-500/60">
                    <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">{champ.name}</div>
                      <div className="text-xs text-foreground-muted">{champ.promotions?.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Videos - Mobile */}
          {profileVideos && profileVideos.length > 0 && (
            <VideoCarousel videos={profileVideos} sectionTitle={wrestler.video_section_title} />
          )}
          {/* Merch Gallery - Mobile */}
          {merchItems && merchItems.length > 0 && (
            <MerchGallery items={merchItems} />
          )}
          {wrestler.verification_status !== 'verified' && (
            <ClaimWrestlerButton wrestlerId={wrestler.id} wrestlerName={wrestler.name} verificationStatus={wrestler.verification_status || 'unverified'} />
          )}
        </div>

        {/* ======================================== */}
        {/* EVENTS */}
        {/* ======================================== */}
        <div className="py-8 border-t border-border">
          {upcomingEvents.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-display font-bold mb-6">Upcoming Events ({upcomingEvents.length})</h2>
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-accent font-bold">{new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-2xl font-bold">{new Date(event.event_date + 'T12:00:00').getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{event.name}</div>
                      <div className="text-sm text-foreground-muted">{event.promotions?.name}{event.city && ` · ${event.city.replace(/,$/, '')}`}{event.state && `, ${event.state}`}{event.country && event.country !== 'USA' && `, ${event.country}`}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold mb-6 text-foreground-muted">Past Events ({pastEvents.length})</h2>
              <div className="space-y-3 opacity-60">
                {pastEvents.slice(0, 10).map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-foreground-muted font-bold">{new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-2xl font-bold">{new Date(event.event_date + 'T12:00:00').getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{event.name}</div>
                      <div className="text-sm text-foreground-muted">{event.promotions?.name}{event.city && ` · ${event.city.replace(/,$/, '')}`}{event.state && `, ${event.state}`}{event.country && event.country !== 'USA' && `, ${event.country}`}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events yet</h3>
              <p className="text-foreground-muted">We don&apos;t have any events listed for {wrestler.name} yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
