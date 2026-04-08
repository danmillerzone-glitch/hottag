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
    // TODO(Task 2): fetch data
    setLoading(false)
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
