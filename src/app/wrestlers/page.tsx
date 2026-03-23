'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Search, ShieldCheck, CalendarCheck, TrendingUp, Loader2, Navigation, Star, Trophy, Map, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'
import { getTodayHawaii, getUserLocation } from '@/lib/utils'
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

// Vegas Weekend auto-hide (same cutoff as NavigationAuth)
const VEGAS_WEEKEND_END = new Date('2026-04-21T06:00:00Z')

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function WrestlersPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WrestlerCard[]>([])
  const [searching, setSearching] = useState(false)

  // Section data
  const [verified, setVerified] = useState<WrestlerCard[]>([])
  const [popular, setPopular] = useState<WrestlerCard[]>([])
  const [mostFollowed, setMostFollowed] = useState<WrestlerCard[]>([])
  const [champions, setChampions] = useState<{ wrestler: WrestlerCard; title: string }[]>([])
  const [beltCollectors, setBeltCollectors] = useState<{ wrestler: WrestlerCard; titleCount: number }[]>([])
  const [roadWarriors, setRoadWarriors] = useState<{ wrestler: WrestlerCard; promoCount: number }[]>([])
  const [vegasWrestlers, setVegasWrestlers] = useState<WrestlerCard[]>([])
  const [loading, setLoading] = useState(true)

  // Near You state
  const [nearYouWrestlers, setNearYouWrestlers] = useState<WrestlerCard[] | null>(null)
  const [nearYouLoading, setNearYouLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading')
  const [radius, setRadius] = useState(100)
  const [allNearEvents, setAllNearEvents] = useState<any[] | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  const showVegas = typeof window !== 'undefined' && new Date() < VEGAS_WEEKEND_END

  useEffect(() => {
    loadSections()
    loadNearYou()
  }, [])

  const loadSections = async () => {
    const supabase = createClient()
    const today = getTodayHawaii()

    const queries: any[] = [
      // Newly Verified — most recently verified wrestlers
      supabase.from('wrestlers').select(SELECT_COLS)
        .eq('verification_status', 'verified')
        .order('verified_at', { ascending: false, nullsFirst: false })
        .limit(12),
      // Most Booked — active indie wrestlers with upcoming shows
      supabase.from('wrestlers').select(SELECT_COLS)
        .gt('upcoming_events_count', 0)
        .order('upcoming_events_count', { ascending: false })
        .limit(18),
      // New Champions — recent title holders
      supabase.from('promotion_championships')
        .select('id, name, won_date, current_champion_id, current_champion_2_id, promotions(name)')
        .not('current_champion_id', 'is', null)
        .order('won_date', { ascending: false, nullsFirst: false })
        .limit(20),
      // Most Followed
      supabase.from('wrestlers').select(SELECT_COLS)
        .gt('follower_count', 0)
        .order('follower_count', { ascending: false })
        .limit(18),
      // Belt Collectors — solo/tag championships
      supabase.from('promotion_championships')
        .select('id, name, current_champion_id, current_champion_2_id, champion_group_id')
        .eq('is_active', true)
        .or('current_champion_id.not.is.null,current_champion_2_id.not.is.null'),
      // Belt Collectors — group championships (tag teams/factions holding titles)
      supabase.from('promotion_championships')
        .select('id, name, champion_group_id')
        .eq('is_active', true)
        .not('champion_group_id', 'is', null),
      // Road Warriors — wrestlers on multiple rosters
      supabase.from('wrestler_promotions')
        .select('wrestler_id')
        .eq('is_active', true),
    ]

    // Vegas Weekend talent (only query if within date range)
    if (showVegas) {
      queries.push(
        supabase.from('event_wrestlers')
          .select('wrestler_id, events!inner(id, vegas_weekend, event_date)')
          .eq('events.vegas_weekend', true)
          .gte('events.event_date', today)
      )
    }

    const results = await Promise.all(queries)
    const [verifiedRes, popularRes, champRes, followedRes, beltRes, groupBeltRes, rosterRes] = results

    setVerified(verifiedRes.data || [])
    setPopular(popularRes.data || [])
    setMostFollowed(followedRes.data || [])

    // Process belt collectors — count unique titles per wrestler
    // Dedup key: name + partner/group context (matches wrestler detail page logic)
    // This correctly merges inter-promotional titles (same name, same holders)
    // while keeping separate titles that share a name but have different holders
    console.log('[Belt Collectors] beltRes count:', beltRes?.data?.length, 'groupBeltRes count:', groupBeltRes?.data?.length)
    const titleKeys: Record<string, Set<string>> = {}
    if (beltRes?.data) {
      for (const c of beltRes.data) {
        const dedupKey = `${c.name}||${c.current_champion_2_id || ''}||${c.champion_group_id || ''}`
        if (c.current_champion_id) {
          if (!titleKeys[c.current_champion_id]) titleKeys[c.current_champion_id] = new Set()
          titleKeys[c.current_champion_id].add(dedupKey)
        }
        if (c.current_champion_2_id) {
          if (!titleKeys[c.current_champion_2_id]) titleKeys[c.current_champion_2_id] = new Set()
          titleKeys[c.current_champion_2_id].add(dedupKey)
        }
      }
    }
    // Group championships — fetch members for each group title
    if (groupBeltRes?.data && groupBeltRes.data.length > 0) {
      const groupIds = groupBeltRes.data.map((c: any) => c.champion_group_id).filter(Boolean)
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from('promotion_group_members')
          .select('group_id, wrestler_id')
          .in('group_id', groupIds)
        if (members) {
          const groupMembers: Record<string, string[]> = {}
          for (const m of members) {
            if (!groupMembers[m.group_id]) groupMembers[m.group_id] = []
            groupMembers[m.group_id].push(m.wrestler_id)
          }
          for (const c of groupBeltRes.data) {
            const dedupKey = `${c.name}||||${c.champion_group_id}`
            const wrestlers = groupMembers[c.champion_group_id] || []
            for (const wId of wrestlers) {
              if (!titleKeys[wId]) titleKeys[wId] = new Set()
              titleKeys[wId].add(dedupKey)
            }
          }
        }
      }
    }
    // Debug: log top wrestlers and their title keys
    const debugTop = Object.entries(titleKeys)
      .map(([id, keys]) => ({ id, count: keys.size, keys: Array.from(keys) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    console.log('[Belt Collectors] Top wrestlers:', JSON.stringify(debugTop, null, 2))

    if (Object.keys(titleKeys).length > 0) {
      // Sort by unique title count descending, take top 6 with 2+ titles
      const topCollectors = Object.entries(titleKeys)
        .map(([id, keys]) => [id, keys.size] as [string, number])
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)

      if (topCollectors.length > 0) {
        const collectorIds = topCollectors.map(([id]) => id)
        const { data: collectorWrestlers } = await supabase
          .from('wrestlers').select(SELECT_COLS)
          .in('id', collectorIds)
        if (collectorWrestlers) {
          const ordered = topCollectors
            .map(([id, count]) => {
              const w = collectorWrestlers.find((cw: WrestlerCard) => cw.id === id)
              return w ? { wrestler: w, titleCount: count } : null
            })
            .filter(Boolean) as { wrestler: WrestlerCard; titleCount: number }[]
          setBeltCollectors(ordered)
        }
      }
    }

    // Process road warriors — wrestlers on the most rosters
    if (rosterRes?.data && rosterRes.data.length > 0) {
      const promoCounts: Record<string, number> = {}
      for (const r of rosterRes.data) {
        promoCounts[r.wrestler_id] = (promoCounts[r.wrestler_id] || 0) + 1
      }
      const topRoad = Object.entries(promoCounts)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)

      if (topRoad.length > 0) {
        const roadIds = topRoad.map(([id]) => id)
        const { data: roadWrestlers } = await supabase
          .from('wrestlers').select(SELECT_COLS)
          .in('id', roadIds)
        if (roadWrestlers) {
          const ordered = topRoad
            .map(([id, count]) => {
              const w = roadWrestlers.find((rw: WrestlerCard) => rw.id === id)
              return w ? { wrestler: w, promoCount: count } : null
            })
            .filter(Boolean) as { wrestler: WrestlerCard; promoCount: number }[]
          setRoadWarriors(ordered)
        }
      }
    }

    // Process champions — fetch wrestler cards for champion IDs
    if (champRes.data && champRes.data.length > 0) {
      const champIds: Record<string, true> = {}
      for (const c of champRes.data) {
        if (c.current_champion_id) champIds[c.current_champion_id] = true
        if (c.current_champion_2_id) champIds[c.current_champion_2_id] = true
      }
      const ids = Object.keys(champIds)
      if (ids.length > 0) {
        const { data: champWrestlers } = await supabase
          .from('wrestlers').select(SELECT_COLS)
          .in('id', ids)
        if (champWrestlers) {
          const ordered: { wrestler: WrestlerCard; title: string }[] = []
          const seen: Record<string, true> = {}
          for (const c of champRes.data) {
            for (const wId of [c.current_champion_id, c.current_champion_2_id]) {
              if (wId && !seen[wId]) {
                const w = champWrestlers.find((cw: WrestlerCard) => cw.id === wId)
                if (w) {
                  ordered.push({ wrestler: w, title: c.name })
                  seen[wId] = true
                }
              }
            }
          }
          setChampions(ordered.slice(0, 12))
        }
      }
    }

    // Vegas Weekend talent
    if (showVegas && results[7]?.data) {
      const vegasIds = Array.from(new Set(results[7].data.map((r: any) => r.wrestler_id))) as string[]
      if (vegasIds.length > 0) {
        const { data: vegasData } = await supabase
          .from('wrestlers').select(SELECT_COLS)
          .in('id', vegasIds)
          .order('follower_count', { ascending: false })
        setVegasWrestlers(vegasData || [])
      }
    }

    setLoading(false)
  }

  const loadNearYou = () => {
    getUserLocation().then(({ coords, status }) => {
      setLocationStatus(status)
      if (coords) {
        setUserCoords(coords)
        fetchNearbyEvents(coords)
      } else {
        setNearYouLoading(false)
      }
    })
  }

  const fetchNearbyEvents = async (coords: { lat: number; lng: number }) => {
    const supabase = createClient()
    const today = getTodayHawaii()

    const { data: events } = await supabase
      .from('events')
      .select('id, latitude, longitude')
      .gte('event_date', today)
      .eq('status', 'upcoming')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200)

    if (events) {
      const withDistance = events.map((e: any) => ({
        ...e,
        distance: calculateDistance(coords.lat, coords.lng, e.latitude, e.longitude),
      }))
      setAllNearEvents(withDistance)
    }
    setNearYouLoading(false)
  }

  // Filter nearby events by radius, then fetch wrestlers for those events
  const nearbyEventIds = useMemo(() => {
    if (!allNearEvents) return []
    return allNearEvents
      .filter((e: any) => e.distance <= radius)
      .map((e: any) => e.id)
  }, [allNearEvents, radius])

  // Fetch wrestlers when nearby event IDs change
  useEffect(() => {
    if (nearbyEventIds.length === 0) {
      setNearYouWrestlers(nearbyEventIds.length === 0 && allNearEvents !== null ? [] : null)
      return
    }

    const fetchWrestlers = async () => {
      const supabase = createClient()
      // Get wrestler IDs from both scraped rosters and promoter announcements
      const [{ data: scraped }, { data: announced }] = await Promise.all([
        supabase.from('event_wrestlers').select('wrestler_id').in('event_id', nearbyEventIds),
        supabase.from('event_announced_talent').select('wrestler_id').in('event_id', nearbyEventIds),
      ])

      const allIds = [...(scraped || []), ...(announced || [])].map((t: any) => t.wrestler_id)
      if (allIds.length === 0) {
        setNearYouWrestlers([])
        return
      }

      const wrestlerIds = Array.from(new Set(allIds)) as string[]
      const { data: wrestlers } = await supabase
        .from('wrestlers').select(SELECT_COLS)
        .in('id', wrestlerIds)
        .order('follower_count', { ascending: false })

      setNearYouWrestlers(wrestlers || [])
    }

    fetchWrestlers()
  }, [nearbyEventIds])

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
            {/* Newly Verified */}
            {verified.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold">Newly Verified</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {verified.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}

            {/* Wrestlers in Your Area */}
            {locationStatus === 'granted' && nearYouWrestlers && nearYouWrestlers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-display font-bold">Wrestlers in Your Area</h2>
                  </div>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="text-sm bg-background-tertiary border border-border rounded-lg px-3 py-1.5 text-foreground cursor-pointer focus:border-accent outline-none"
                  >
                    <option value={25}>25 miles</option>
                    <option value={50}>50 miles</option>
                    <option value={100}>100 miles</option>
                    <option value={200}>200 miles</option>
                    <option value={500}>500 miles</option>
                  </select>
                </div>
                <WrestlerCarousel wrestlers={nearYouWrestlers} />
              </section>
            )}

            {/* Vegas Weekend Talent */}
            {showVegas && vegasWrestlers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-xl font-display font-bold text-yellow-400">Vegas Weekend Talent</h2>
                  </div>
                  <Link href="/vegas-weekend" className="text-yellow-400 hover:text-yellow-300 font-medium text-sm">
                    View all &rarr;
                  </Link>
                </div>
                <WrestlerCarousel wrestlers={vegasWrestlers} />
              </section>
            )}

            {/* Belt Collectors */}
            {beltCollectors.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-display font-bold">Belt Collectors</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {beltCollectors.map(({ wrestler, titleCount }) => (
                    <WrestlerHeroCard key={wrestler.id} wrestler={wrestler} badge={`${titleCount} Titles`} />
                  ))}
                </div>
              </section>
            )}

            {/* Road Warriors — wrestlers on the most rosters */}
            {roadWarriors.length > 0 && (
              <section>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-display font-bold">Road Warriors</h2>
                  </div>
                  <p className="text-sm text-foreground-muted mt-1 ml-7">Wrestlers appearing on the most promotion rosters</p>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {roadWarriors.map(({ wrestler, promoCount }) => (
                    <WrestlerHeroCard key={wrestler.id} wrestler={wrestler} badge={`${promoCount} Rosters`} />
                  ))}
                </div>
              </section>
            )}

            {/* New Champions */}
            {champions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-display font-bold">New Champions</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {champions.map(({ wrestler, title }) => (
                    <WrestlerHeroCard key={wrestler.id} wrestler={wrestler} badge={title} />
                  ))}
                </div>
              </section>
            )}

            {/* Most Booked */}
            {popular.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold">Most Booked</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {popular.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}

            {/* Most Followed */}
            {mostFollowed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold">Most Followed</h2>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {mostFollowed.map(w => <WrestlerHeroCard key={w.id} wrestler={w} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WrestlerHeroCard({ wrestler, badge }: { wrestler: WrestlerCard; badge?: string }) {
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
        {/* Championship badge */}
        {badge && (
          <div className="absolute top-2 left-2 z-[3]">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 whitespace-nowrap">
              {badge}
            </span>
          </div>
        )}
        {/* Name + moniker overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
          {wrestler.moniker && (
            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-2 drop-shadow-lg">
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

function WrestlerCarousel({ wrestlers }: { wrestlers: WrestlerCard[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number>(0)

  const checkScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const left = el.scrollLeft > 4
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      setCanScrollLeft(prev => prev !== left ? left : prev)
      setCanScrollRight(prev => prev !== right ? right : prev)
    })
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [wrestlers, checkScroll])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.clientWidth || 180
    const distance = cardWidth * 3
    el.scrollBy({ left: dir === 'left' ? -distance : distance, behavior: 'smooth' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { scroll('left'); e.preventDefault() }
    if (e.key === 'ArrowRight') { scroll('right'); e.preventDefault() }
  }

  return (
    <div className="relative group/carousel">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 -translate-x-1/2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 translate-x-1/2"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {wrestlers.map(w => (
          <div key={w.id} className="flex-shrink-0 w-[calc((100%-2*0.75rem)/3)] sm:w-[calc((100%-3*0.75rem)/4)] md:w-[calc((100%-4*0.75rem)/5)] lg:w-[calc((100%-5*0.75rem)/6)]">
            <WrestlerHeroCard wrestler={w} />
          </div>
        ))}
      </div>
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
      )}
    </div>
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
