'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'
import { WRESTLING_STYLE_LABELS } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import {
  Shuffle,
  CheckCircle2,
  MapPin,
  Activity,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  User,
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
}

type SpotlightEntity = SpotlightWrestler | SpotlightPromotion

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

        // ─── Step 1: Resolve IDs of entities with upcoming events ─────────
        // Three queries in parallel. event_wrestlers and event_announced_talent
        // both link wrestlers to events; we union their wrestler_ids.
        const [promoEventsRes, ewRes, atRes] = await Promise.all([
          supabase
            .from('events')
            .select('promotion_id')
            .gte('event_date', today)
            .eq('status', 'upcoming')
            .not('promotion_id', 'is', null),
          supabase
            .from('event_wrestlers')
            .select('wrestler_id, events!inner(event_date, status)')
            .gte('events.event_date', today)
            .eq('events.status', 'upcoming'),
          supabase
            .from('event_announced_talent')
            .select('wrestler_id, events!inner(event_date, status)')
            .gte('events.event_date', today)
            .eq('events.status', 'upcoming'),
        ])

        if (cancelled) return

        const promotionIdsWithEvents = Array.from(
          new Set(
            (promoEventsRes.data || [])
              .map((e: any) => e.promotion_id)
              .filter(Boolean)
          )
        ) as string[]

        const wrestlerIdSet = new Set<string>()
        for (const row of ewRes.data || []) {
          if ((row as any).wrestler_id) wrestlerIdSet.add((row as any).wrestler_id)
        }
        for (const row of atRes.data || []) {
          if ((row as any).wrestler_id) wrestlerIdSet.add((row as any).wrestler_id)
        }
        const wrestlerIdsWithEvents = Array.from(wrestlerIdSet)

        // If neither pool has any upcoming-event participants, bail early.
        if (wrestlerIdsWithEvents.length === 0 && promotionIdsWithEvents.length === 0) {
          setLoading(false)
          return
        }

        // ─── Step 2: Fetch eligible entities in parallel ──────────────────
        // Client-side filters in Step 3 handle empty bios and social-link
        // presence; we do NOT chain multiple .or() calls here — PostgREST
        // handles chained .or() poorly and it is a known footgun.
        const [wrestlersRes, promotionsRes] = await Promise.all([
          wrestlerIdsWithEvents.length > 0
            ? supabase
                .from('wrestlers')
                .select(
                  'id, name, slug, photo_url, render_url, hero_style, moniker, bio, hometown, wrestling_style, twitter_handle, instagram_handle, tiktok_handle, youtube_url, website, bluesky_handle'
                )
                .eq('verification_status', 'verified')
                .not('claimed_by', 'is', null)
                .not('bio', 'is', null)
                .or('photo_url.not.is.null,render_url.not.is.null')
                .in('id', wrestlerIdsWithEvents)
            : Promise.resolve({ data: [] as any[], error: null }),
          promotionIdsWithEvents.length > 0
            ? supabase
                .from('promotions')
                .select(
                  'id, name, slug, logo_url, description, region, city, state, country, twitter_handle, instagram_handle, tiktok_handle, facebook_url, youtube_url, website, bluesky_handle'
                )
                .eq('verification_status', 'verified')
                .not('claimed_by', 'is', null)
                .not('logo_url', 'is', null)
                .not('description', 'is', null)
                .in('id', promotionIdsWithEvents)
            : Promise.resolve({ data: [] as any[], error: null }),
        ])

        if (cancelled) return

        // ─── Step 3: Merge, client-side filter, type-tag, Fisher-Yates ────
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
            w.bluesky_handle
          )

        const promotionHasSocial = (p: any) =>
          !!(
            p.twitter_handle ||
            p.instagram_handle ||
            p.tiktok_handle ||
            p.facebook_url ||
            p.youtube_url ||
            p.website ||
            p.bluesky_handle
          )

        const merged: SpotlightEntity[] = [
          ...((wrestlersRes.data || []) as any[])
            .filter((w) => hasText(w.bio) && wrestlerHasSocial(w))
            .map<SpotlightWrestler>((w) => ({ type: 'wrestler' as const, ...w })),
          ...((promotionsRes.data || []) as any[])
            .filter((p) => hasText(p.description) && promotionHasSocial(p))
            .map<SpotlightPromotion>((p) => ({ type: 'promotion' as const, ...p })),
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

  if (loading) {
    return (
      <section className="py-10" aria-label="Random spotlight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
            <Shuffle className="w-6 h-6 text-accent" />
            Random Spotlight
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

  // TODO(Task 3): render the card
  return null
}
