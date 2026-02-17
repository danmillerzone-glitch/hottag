'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Search, ShieldCheck, Calendar, TrendingUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'
import RequestPageButton from '@/components/RequestPageButton'

interface WrestlerCard {
  id: string
  name: string
  slug: string
  photo_url: string | null
  render_url: string | null
  hometown: string | null
  moniker: string | null
  hero_style: HeroStyle | null
  verification_status: string | null
  follower_count: number
  upcoming_events_count: number
}

const SELECT_COLS = 'id, name, slug, photo_url, render_url, hometown, moniker, hero_style, verification_status, follower_count, upcoming_events_count'

export default function WrestlersPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WrestlerCard[]>([])
  const [searching, setSearching] = useState(false)
  const [verified, setVerified] = useState<WrestlerCard[]>([])
  const [popular, setPopular] = useState<WrestlerCard[]>([])
  const [active, setActive] = useState<WrestlerCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    const supabase = createClient()

    const [verifiedRes, popularRes, activeRes] = await Promise.all([
      supabase.from('wrestlers').select(SELECT_COLS)
        .eq('verification_status', 'verified').order('follower_count', { ascending: false }).limit(12),
      supabase.from('wrestlers').select(SELECT_COLS)
        .order('follower_count', { ascending: false }).limit(18),
      supabase.from('wrestlers').select(SELECT_COLS)
        .gt('upcoming_events_count', 0).order('upcoming_events_count', { ascending: false }).limit(12),
    ])

    setVerified(verifiedRes.data || [])
    setPopular(popularRes.data || [])
    setActive(activeRes.data || [])
    setLoading(false)
  }

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('wrestlers')
      .select(SELECT_COLS)
      .ilike('name', `%${q}%`)
      .order('follower_count', { ascending: false })
      .limit(20)
    setSearchResults(data || [])
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  const isSearching = query.length >= 2

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Wrestlers</h1>
            <p className="text-foreground-muted">
              Discover indie wrestlers and track their upcoming appearances
            </p>
          </div>
          <RequestPageButton />
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wrestlers by name..."
            className="w-full md:w-96 pl-12 pr-4 py-3 rounded-xl bg-background-secondary border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder-foreground-muted"
          />
          {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted animate-spin" />}
        </div>

        {/* Search results */}
        {isSearching ? (
          <div>
            <h2 className="text-lg font-display font-semibold mb-4 text-foreground-muted">
              {searchResults.length > 0 ? `${searchResults.length} results for "${query}"` : searching ? 'Searching...' : `No results for "${query}"`}
            </h2>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {searchResults.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
            </div>
          </div>
        ) : loading ? (
          <WrestlersSkeleton />
        ) : (
          <div className="space-y-10">
            {/* Verified Wrestlers */}
            {verified.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold">Verified Wrestlers</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {verified.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}

            {/* Most Active */}
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold">Most Booked</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {active.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}

            {/* Popular */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-display font-bold">Popular</h2>
              </div>
              <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {popular.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function WrestlerHeroCard({ wrestler }: { wrestler: WrestlerCard }) {
  const imageUrl = wrestler.render_url || wrestler.photo_url
  const heroCSS = getHeroCSS(wrestler.hero_style || null)
  const hasTheme = !!wrestler.hero_style

  return (
    <Link href={`/wrestlers/${wrestler.slug}`} className="block group">
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary">
        {/* Hero background */}
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
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 180px"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-foreground-muted/30" />
          </div>
        )}
        {/* Verified badge */}
        {wrestler.verification_status === 'verified' && (
          <div className="absolute top-2 right-2 z-[3]">
            <ShieldCheck className="w-4 h-4 text-accent drop-shadow-lg" />
          </div>
        )}
        {/* Name + moniker overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
          {wrestler.moniker && (
            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
              &ldquo;{wrestler.moniker}&rdquo;
            </span>
          )}
          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
            {wrestler.name}
          </span>
        </div>
      </div>
    </Link>
  )
}

function WrestlersSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map(s => (
        <div key={s}>
          <div className="h-7 w-48 skeleton rounded mb-4" />
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary animate-pulse">
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                  <div className="h-3 w-16 rounded bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
