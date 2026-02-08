'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Search, ShieldCheck, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { formatNumber } from '@/lib/utils'
import RequestPageButton from '@/components/RequestPageButton'

interface WrestlerCard {
  id: string
  name: string
  slug: string
  photo_url: string | null
  hometown: string | null
  verification_status: string | null
  follower_count: number
  upcoming_events_count: number
}

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
      supabase.from('wrestlers').select('id, name, slug, photo_url, hometown, verification_status, follower_count, upcoming_events_count')
        .eq('verification_status', 'verified').order('follower_count', { ascending: false }).limit(12),
      supabase.from('wrestlers').select('id, name, slug, photo_url, hometown, verification_status, follower_count, upcoming_events_count')
        .order('follower_count', { ascending: false }).limit(16),
      supabase.from('wrestlers').select('id, name, slug, photo_url, hometown, verification_status, follower_count, upcoming_events_count')
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
      .select('id, name, slug, photo_url, hometown, verification_status, follower_count, upcoming_events_count')
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map(w => <WrestlerCardComponent key={w.id} wrestler={w} />)}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {verified.map(w => <WrestlerCardComponent key={w.id} wrestler={w} />)}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {active.map(w => <WrestlerCardComponent key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}

            {/* Popular */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-display font-bold">Popular</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popular.map(w => <WrestlerCardComponent key={w.id} wrestler={w} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function WrestlerCardComponent({ wrestler }: { wrestler: WrestlerCard }) {
  return (
    <Link
      href={`/wrestlers/${wrestler.slug}`}
      className="flex items-center gap-3 p-4 rounded-xl bg-background-secondary border border-border hover:border-accent/50 transition-colors group"
    >
      <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden">
        {wrestler.photo_url ? (
          <Image src={wrestler.photo_url} alt={wrestler.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
        ) : (
          <User className="w-6 h-6 text-foreground-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{wrestler.name}</span>
          {wrestler.verification_status === 'verified' && (
            <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
          {wrestler.hometown && <span className="truncate">{wrestler.hometown}</span>}
          {wrestler.upcoming_events_count > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3" /> {wrestler.upcoming_events_count}
            </span>
          )}
          {wrestler.follower_count > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Users className="w-3 h-3" /> {formatNumber(wrestler.follower_count)}
            </span>
          )}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-background-secondary border border-border">
                <div className="w-12 h-12 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
