'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'
import { WRESTLING_STYLE_LABELS } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii, formatEventDate, formatLocation } from '@/lib/utils'
import {
  Shuffle,
  CheckCircle2,
  MapPin,
  Activity,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  Mail,
  User,
  Crown,
  Calendar,
} from 'lucide-react'

// ───────── Inline social icons (match wrestler page pattern) ─────────
// Lucide does not ship X or TikTok icons; these SVG bodies are copied from
// src/app/wrestlers/[slug]/page.tsx:20-24. Do NOT lift into a shared module —
// only this component and the wrestler/promotion pages use them, and those
// pages still inline their own copies. Keeping this inline is intentional YAGNI.
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.65a8.35 8.35 0 0 0 4.76 1.49V6.69h-1z" />
    </svg>
  )
}

// ───────── Types ─────────
type SpotlightEvent = {
  id: string
  name: string
  event_date: string
  city: string | null
  state: string | null
  country: string | null
  venue_name: string | null
}

type SpotlightChampionship = {
  name: string
  promotionSlug: string
}

type SpotlightWrestler = {
  type: 'wrestler'
  id: string
  name: string
  slug: string
  photo_url: string | null
  render_url: string | null
  hero_style: HeroStyle | null
  moniker: string | null
  bio: string
  hometown: string | null
  wrestling_style: string[] | null
  twitter_handle: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_url: string | null
  website: string | null
  bluesky_handle: string | null
  booking_email: string | null
  championships: SpotlightChampionship[]
  nextEvent: SpotlightEvent | null
}

type SpotlightPromotion = {
  type: 'promotion'
  id: string
  name: string
  slug: string
  logo_url: string
  description: string
  region: string | null
  city: string | null
  state: string | null
  country: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  facebook_url: string | null
  youtube_url: string | null
  website: string | null
  bluesky_handle: string | null
  booking_email: string | null
  nextEvent: SpotlightEvent | null
}

type SpotlightEntity = SpotlightWrestler | SpotlightPromotion

// ───────── Helpers ─────────
const FLAGS_BASE_URL =
  'https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags'

function truncateBio(text: string, max = 220): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…'
}

function promotionLocation(p: SpotlightPromotion): string | null {
  // Prefer specific place (city+state > city > country); fall back to scene region
  if (p.city && p.state) return `${p.city}, ${p.state}`
  if (p.city) return p.city
  if (p.country) return p.country
  if (p.region && p.region.trim()) return p.region
  return null
}

type SocialLink = { href: string; icon: React.ComponentType<{ className?: string }>; label: string }

function wrestlerSocialLinks(w: SpotlightWrestler): SocialLink[] {
  const links: SocialLink[] = []
  if (w.twitter_handle) links.push({ href: `https://x.com/${w.twitter_handle}`, icon: XIcon, label: `${w.name} on X` })
  if (w.instagram_handle) links.push({ href: `https://instagram.com/${w.instagram_handle}`, icon: Instagram, label: `${w.name} on Instagram` })
  if (w.tiktok_handle) links.push({ href: `https://tiktok.com/@${w.tiktok_handle}`, icon: TikTokIcon, label: `${w.name} on TikTok` })
  if (w.youtube_url) links.push({ href: w.youtube_url, icon: Youtube, label: `${w.name} on YouTube` })
  if (w.website) links.push({ href: w.website, icon: Globe, label: `${w.name} website` })
  if (w.booking_email) links.push({ href: `mailto:${w.booking_email}`, icon: Mail, label: `Email ${w.name}` })
  return links
}

function promotionSocialLinks(p: SpotlightPromotion): SocialLink[] {
  const links: SocialLink[] = []
  if (p.twitter_handle) links.push({ href: `https://x.com/${p.twitter_handle}`, icon: XIcon, label: `${p.name} on X` })
  if (p.instagram_handle) links.push({ href: `https://instagram.com/${p.instagram_handle}`, icon: Instagram, label: `${p.name} on Instagram` })
  if (p.tiktok_handle) links.push({ href: `https://tiktok.com/@${p.tiktok_handle}`, icon: TikTokIcon, label: `${p.name} on TikTok` })
  if (p.youtube_url) links.push({ href: p.youtube_url, icon: Youtube, label: `${p.name} on YouTube` })
  if (p.facebook_url) links.push({ href: p.facebook_url, icon: Facebook, label: `${p.name} on Facebook` })
  if (p.website) links.push({ href: p.website, icon: Globe, label: `${p.name} website` })
  if (p.booking_email) links.push({ href: `mailto:${p.booking_email}`, icon: Mail, label: `Email ${p.name}` })
  return links
}

// ───────── Component ─────────
export default function RandomSpotlightSection() {
  const [loading, setLoading] = useState(true)
  const [pool, setPool] = useState<SpotlightEntity[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const supabase = createClient()
        const today = getTodayHawaii()

        // ─── Step 1: Fetch verified+claimed entities, championships, and the
        // event lookups for "Next Event" enrichment — all in parallel.
        //
        // We deliberately do NOT pre-filter entities by "has upcoming event":
        //   1. The verified+claimed pool is small (~100 wrestlers, ~22 promos),
        //      so feature-gating it on event presence cuts the pool in half
        //      and excludes wrestlers whose shows haven't been scraped yet.
        //   2. Passing hundreds of UUIDs to .in() blows past the HTTP header
        //      size limit and silently returns 0 rows. We learned this the
        //      hard way — a previous version had .in('id', wrestlerIdsWithEvents)
        //      which dropped wrestlers from the pool entirely in production.
        //
        // Active championships are also fetched unfiltered (only ~50–100 rows
        // across all promotions) and joined to wrestlers client-side.
        const eventCols = 'id, name, event_date, city, state, country, venue_name'
        const [
          wrestlersRes,
          promotionsRes,
          promoEventsRes,
          ewRes,
          atRes,
          champs1Res,
          champs2Res,
        ] = await Promise.all([
          supabase
            .from('wrestlers')
            .select(
              'id, name, slug, photo_url, render_url, hero_style, moniker, bio, hometown, wrestling_style, twitter_handle, instagram_handle, tiktok_handle, youtube_url, website, bluesky_handle, booking_email'
            )
            .eq('verification_status', 'verified')
            .not('claimed_by', 'is', null)
            .not('bio', 'is', null),
          supabase
            .from('promotions')
            .select(
              'id, name, slug, logo_url, description, region, city, state, country, twitter_handle, instagram_handle, tiktok_handle, facebook_url, youtube_url, website, bluesky_handle, booking_email'
            )
            .eq('verification_status', 'verified')
            .not('claimed_by', 'is', null)
            .not('logo_url', 'is', null)
            .not('description', 'is', null),
          supabase
            .from('events')
            .select(`${eventCols}, promotion_id`)
            .gte('event_date', today)
            .eq('status', 'upcoming')
            .not('promotion_id', 'is', null),
          supabase
            .from('event_wrestlers')
            .select(`wrestler_id, events!inner(${eventCols}, status)`)
            .gte('events.event_date', today)
            .eq('events.status', 'upcoming'),
          supabase
            .from('event_announced_talent')
            .select(`wrestler_id, events!inner(${eventCols}, status)`)
            .gte('events.event_date', today)
            .eq('events.status', 'upcoming'),
          supabase
            .from('promotion_championships')
            .select('name, short_name, current_champion_id, promotions(slug)')
            .eq('is_active', true)
            .not('current_champion_id', 'is', null),
          supabase
            .from('promotion_championships')
            .select('name, short_name, current_champion_2_id, promotions(slug)')
            .eq('is_active', true)
            .not('current_champion_2_id', 'is', null),
        ])

        if (cancelled) return

        // ─── Step 2: Build next-event lookup maps ─────────────────────────
        // Reduce to earliest upcoming event per entity. String compare is safe
        // for YYYY-MM-DD dates — lexicographic order matches chronological order.
        const toSpotlightEvent = (ev: any): SpotlightEvent => ({
          id: ev.id,
          name: ev.name,
          event_date: ev.event_date,
          city: ev.city,
          state: ev.state,
          country: ev.country,
          venue_name: ev.venue_name,
        })

        const nextEventByPromo = new Map<string, SpotlightEvent>()
        for (const ev of (promoEventsRes.data || []) as any[]) {
          if (!ev.promotion_id) continue
          const existing = nextEventByPromo.get(ev.promotion_id)
          if (!existing || ev.event_date < existing.event_date) {
            nextEventByPromo.set(ev.promotion_id, toSpotlightEvent(ev))
          }
        }

        const nextEventByWrestler = new Map<string, SpotlightEvent>()
        const pushWrestlerEvent = (wrestlerId: string, ev: any) => {
          const existing = nextEventByWrestler.get(wrestlerId)
          if (!existing || ev.event_date < existing.event_date) {
            nextEventByWrestler.set(wrestlerId, toSpotlightEvent(ev))
          }
        }
        for (const row of (ewRes.data || []) as any[]) {
          if (row.wrestler_id && row.events) pushWrestlerEvent(row.wrestler_id, row.events)
        }
        for (const row of (atRes.data || []) as any[]) {
          if (row.wrestler_id && row.events) pushWrestlerEvent(row.wrestler_id, row.events)
        }

        // ─── Step 3: Build championships map ──────────────────────────────
        // Wrestler-id → championships, deduped on name, short_name wins.
        // Skip rows missing a promotion slug — a title chip with no link target
        // would be confusing; we'd rather omit it.
        const champsByWrestler = new Map<string, SpotlightChampionship[]>()
        const addChamp = (
          wrestlerId: string | null | undefined,
          name: string | null | undefined,
          promotionSlug: string | null | undefined
        ) => {
          if (!wrestlerId || !name || !promotionSlug) return
          const arr = champsByWrestler.get(wrestlerId) || []
          if (!arr.some((c) => c.name === name)) arr.push({ name, promotionSlug })
          champsByWrestler.set(wrestlerId, arr)
        }
        for (const row of (champs1Res.data || []) as any[]) {
          addChamp(row.current_champion_id, row.short_name || row.name, row.promotions?.slug)
        }
        for (const row of (champs2Res.data || []) as any[]) {
          addChamp(row.current_champion_2_id, row.short_name || row.name, row.promotions?.slug)
        }

        // ─── Step 4: Merge, client-side filter, type-tag, Fisher-Yates ────
        // Photo/render and social-link presence are checked client-side rather
        // than in the SQL query because PostgREST's .or() syntax is fragile
        // (especially when chained with .in()) and the entity sets are small
        // enough that filtering 100 rows in JS is free.
        const hasText = (s: string | null | undefined) =>
          !!s && s.trim().length > 0

        // Wrestlers table has no facebook_url column; promotions does.
        const wrestlerHasSocial = (w: any) =>
          !!(
            w.twitter_handle ||
            w.instagram_handle ||
            w.tiktok_handle ||
            w.youtube_url ||
            w.website ||
            w.bluesky_handle ||
            w.booking_email
          )

        const promotionHasSocial = (p: any) =>
          !!(
            p.twitter_handle ||
            p.instagram_handle ||
            p.tiktok_handle ||
            p.facebook_url ||
            p.youtube_url ||
            p.website ||
            p.bluesky_handle ||
            p.booking_email
          )

        const merged: SpotlightEntity[] = [
          ...((wrestlersRes.data || []) as any[])
            .filter(
              (w) =>
                (w.photo_url || w.render_url) &&
                hasText(w.bio) &&
                wrestlerHasSocial(w)
            )
            .map<SpotlightWrestler>((w) => ({
              type: 'wrestler' as const,
              ...w,
              championships: champsByWrestler.get(w.id) || [],
              nextEvent: nextEventByWrestler.get(w.id) || null,
            })),
          ...((promotionsRes.data || []) as any[])
            .filter((p) => hasText(p.description) && promotionHasSocial(p))
            .map<SpotlightPromotion>((p) => ({
              type: 'promotion' as const,
              ...p,
              nextEvent: nextEventByPromo.get(p.id) || null,
            })),
        ]

        // Fisher-Yates shuffle in place. 5 lines, used once, not lifted.
        for (let i = merged.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[merged[i], merged[j]] = [merged[j], merged[i]]
        }

        if (cancelled) return
        setPool(merged)
        setIndex(0)
        setLoading(false)
      } catch (err) {
        // Silent failure — the homepage is more important than this section.
        // eslint-disable-next-line no-console
        console.error('[RandomSpotlight] fetch failed', err)
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleShuffle = () => {
    if (pool.length === 0) return
    if (index + 1 < pool.length) {
      setIndex(index + 1)
      return
    }
    // Wrapped past the end — reshuffle in place and reset to 0.
    const copy = [...pool]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setPool(copy)
    setIndex(0)
  }

  if (loading) {
    return (
      <section className="py-10" aria-label="Discover">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
            <Shuffle className="w-6 h-6 text-accent" />
            Discover
          </h2>
          <div className="bg-background-secondary rounded-2xl border border-border p-6 md:p-8 animate-pulse">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-60 aspect-[4/5] bg-background-tertiary rounded-xl" />
              <div className="flex-1 space-y-4">
                <div className="h-3 w-32 bg-background-tertiary rounded" />
                <div className="h-8 w-3/4 bg-background-tertiary rounded" />
                <div className="h-4 w-full bg-background-tertiary rounded" />
                <div className="h-4 w-5/6 bg-background-tertiary rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (pool.length === 0) return null

  const entity = pool[index]
  const isWrestler = entity.type === 'wrestler'

  // Compute hero background for wrestler image slot
  const heroCSS = isWrestler ? getHeroCSS(entity.hero_style || null) : null
  const hasTheme = isWrestler && !!entity.hero_style

  const wrestlerImage = isWrestler ? (entity.render_url || entity.photo_url) : null
  const socials = isWrestler ? wrestlerSocialLinks(entity) : promotionSocialLinks(entity)

  const bio = isWrestler ? entity.bio : (entity as SpotlightPromotion).description
  const detailHref = isWrestler
    ? `/wrestlers/${entity.slug}`
    : `/promotions/${(entity as SpotlightPromotion).slug}`

  return (
    <section className="py-10" aria-label="Discover">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shuffle className="w-6 h-6 text-accent" />
            Discover
          </h2>
        </div>

        <div className="bg-background-secondary rounded-2xl border border-border p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* ───── Image slot ───── */}
            <div className="w-full max-w-xs mx-auto md:mx-0 md:w-60 flex-shrink-0">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary">
                {isWrestler ? (
                  <>
                    {/* Themed background */}
                    {hasTheme && heroCSS && (
                      <div className="absolute inset-0 z-0">
                        {entity.hero_style?.type === 'flag' ? (
                          <img
                            src={`${FLAGS_BASE_URL}/${entity.hero_style.value.toLowerCase()}.jpg`}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                          />
                        ) : (
                          <>
                            <div
                              className="absolute inset-0"
                              style={{ background: heroCSS.background, opacity: 0.5 }}
                            />
                            {heroCSS.texture && (
                              <div
                                className="absolute inset-0"
                                style={{ background: heroCSS.texture, opacity: 0.3 }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {wrestlerImage ? (
                      <Image
                        src={wrestlerImage}
                        alt={entity.name}
                        fill
                        className={`${entity.render_url ? 'object-contain object-bottom' : 'object-cover'} relative z-[1]`}
                        sizes="(max-width: 768px) 280px, 240px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-foreground-muted/30" />
                      </div>
                    )}
                  </>
                ) : (
                  /* Promotion logo frame — logo fills full card width */
                  <div className="absolute inset-0 bg-gradient-to-br from-background-tertiary to-background-secondary flex items-center justify-center">
                    <Image
                      src={(entity as SpotlightPromotion).logo_url}
                      alt={entity.name}
                      width={480}
                      height={480}
                      className="w-full h-auto max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ───── Text block ───── */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs tracking-wider uppercase text-foreground-muted">
                {isWrestler ? 'WRESTLER' : 'PROMOTION'}
                <span>·</span>
                <span className="flex items-center gap-1 text-attending">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  verified
                </span>
              </div>

              {isWrestler && entity.moniker && (
                <p className="text-sm md:text-base italic text-accent truncate -mb-2">
                  &ldquo;{entity.moniker}&rdquo;
                </p>
              )}

              <Link
                href={detailHref}
                className="text-xl md:text-2xl font-display font-bold text-foreground hover:text-accent transition-colors truncate"
              >
                {entity.name}
              </Link>

              {isWrestler && entity.championships.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entity.championships.map((champ) => (
                    <Link
                      key={`${champ.promotionSlug}-${champ.name}`}
                      href={`/promotions/${champ.promotionSlug}`}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[#ffd700]/15 hover:bg-[#ffd700]/25 border border-[#ffd700] text-[#ffd700] font-bold transition-colors"
                    >
                      <Crown className="w-3 h-3" />
                      {champ.name}
                    </Link>
                  ))}
                </div>
              )}

              <p className="text-sm text-foreground-muted leading-relaxed">
                {truncateBio(bio)}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                {isWrestler && entity.hometown && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-background-tertiary text-foreground-muted">
                    <MapPin className="w-3 h-3" />
                    {entity.hometown}
                  </span>
                )}
                {isWrestler && entity.wrestling_style && entity.wrestling_style.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-background-tertiary text-foreground-muted">
                    <Activity className="w-3 h-3" />
                    {entity.wrestling_style
                      .slice(0, 2)
                      .map((s) => WRESTLING_STYLE_LABELS[s] || s)
                      .join(' · ')}
                  </span>
                )}
                {!isWrestler && (() => {
                  const p = entity as SpotlightPromotion
                  const loc = promotionLocation(p)
                  if (!loc) return null
                  // Globe only when we fell through to the scene region (no city/country)
                  const Icon = !p.city && !p.country && p.region ? Globe : MapPin
                  return (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-background-tertiary text-foreground-muted">
                      <Icon className="w-3 h-3" />
                      {loc}
                    </span>
                  )
                })()}
              </div>

              {/* Social icons */}
              {socials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {socials.map((s) => {
                    const Icon = s.icon
                    return (
                      <a
                        key={s.href}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="w-9 h-9 rounded-full bg-background-tertiary hover:bg-accent/20 hover:text-accent text-foreground-muted flex items-center justify-center transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    )
                  })}
                </div>
              )}

              {/* Next event block */}
              {entity.nextEvent && (
                <Link
                  href={`/events/${entity.nextEvent.id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background-tertiary/60 hover:bg-background-tertiary border border-border hover:border-accent/50 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-0.5">
                      Next Event
                    </div>
                    <div className="text-sm text-foreground group-hover:text-accent font-medium truncate transition-colors">
                      {formatEventDate(entity.nextEvent.event_date)} · {entity.nextEvent.name}
                    </div>
                    {(entity.nextEvent.venue_name ||
                      entity.nextEvent.city ||
                      entity.nextEvent.state ||
                      entity.nextEvent.country) && (
                      <div className="text-xs text-foreground-muted truncate">
                        {[
                          entity.nextEvent.venue_name,
                          formatLocation(
                            entity.nextEvent.city,
                            entity.nextEvent.state,
                            entity.nextEvent.country
                          ),
                        ]
                          .filter((s) => s && s !== 'TBA')
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-2">
                <Link href={detailHref} className="btn btn-primary flex-1 sm:flex-none justify-center">
                  Visit Page →
                </Link>
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="btn btn-secondary flex-1 sm:flex-none justify-center"
                  aria-label="Show another random wrestler or promotion"
                >
                  <Shuffle className="w-4 h-4 mr-1.5" />
                  Shuffle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
