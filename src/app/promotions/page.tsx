'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Building2, MapPin, Globe, ChevronDown, Flame, Search } from 'lucide-react'
import RequestPageButton from '@/components/RequestPageButton'

// Continent groupings mapping DB region values
const CONTINENTS = [
  {
    id: 'north-america',
    label: 'North America',
    regions: ['National', 'Northeast', 'Mid Atlantic', 'Southeast', 'South', 'Midwest', 'West', 'Pacific Northwest', 'Canada', 'Mexico'],
  },
  {
    id: 'central-south-america',
    label: 'Central & South America',
    regions: ['Latin America', 'Puerto Rico'],
  },
  {
    id: 'uk-europe',
    label: 'UK & Europe',
    regions: ['United Kingdom', 'Europe'],
  },
  {
    id: 'africa',
    label: 'Africa',
    regions: ['Africa'],
  },
  {
    id: 'asia',
    label: 'Asia',
    regions: ['Japan', 'Asia', 'Middle East'],
  },
  {
    id: 'australia',
    label: 'Australia',
    regions: ['Australia & New Zealand'],
  },
]

// Sub-region display order
const REGION_ORDER = [
  // North America
  'National', 'Northeast', 'Mid Atlantic', 'Southeast', 'South', 'Midwest', 'West', 'Pacific Northwest', 'Canada', 'Mexico',
  // Central & South America
  'Latin America', 'Puerto Rico',
  // UK & Europe
  'United Kingdom', 'Europe',
  // Africa
  'Africa',
  // Asia
  'Japan', 'Asia', 'Middle East',
  // Australia
  'Australia & New Zealand',
  // Catch-all
  'Other',
]

// Build a quick lookup: region → continent id
const REGION_TO_CONTINENT: Record<string, string> = {}
for (const continent of CONTINENTS) {
  for (const region of continent.regions) {
    REGION_TO_CONTINENT[region] = continent.id
  }
}

// Normalize Cagematch country names for UK/Europe display
const COUNTRY_NORMALIZE: Record<string, string> = {
  'UK': 'United Kingdom',
  'Deutschland': 'Germany',
  'Österreich': 'Austria',
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [mostActive, setMostActive] = useState<{ promo: any; eventCount: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContinent, setSelectedContinent] = useState<string>('north-america')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const expandAll = (groups: string[]) => {
    setExpandedGroups(new Set(groups))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [promoRes, eventRes] = await Promise.all([
        supabase.from('promotions')
          .select('id, name, slug, logo_url, region, city, state, country, twitter_handle')
          .order('name')
          .limit(1000),
        supabase.from('events')
          .select('promotion_id')
          .gte('event_date', '2025-01-01'),
      ])

      if (promoRes.error) {
        console.error('Error fetching promotions:', promoRes.error)
        setPromotions([])
      } else {
        setPromotions(promoRes.data || [])

        // Count events per promotion, match with promo data
        if (eventRes.data && promoRes.data) {
          const counts: Record<string, number> = {}
          for (const e of eventRes.data) {
            if (e.promotion_id) counts[e.promotion_id] = (counts[e.promotion_id] || 0) + 1
          }
          const promoLookup: Record<string, any> = {}
          for (const p of promoRes.data) promoLookup[p.id] = p
          const top = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([id, count]) => ({ promo: promoLookup[id], eventCount: count }))
            .filter(e => e.promo)
          setMostActive(top as { promo: any; eventCount: number }[])
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const { filteredByRegion, continentCounts, filteredCount } = useMemo(() => {
    // Count promotions per continent
    const counts: Record<string, number> = {}
    let unmapped = 0
    for (const continent of CONTINENTS) {
      counts[continent.id] = 0
    }
    for (const p of promotions) {
      const region = p.region || 'Other'
      const continentId = REGION_TO_CONTINENT[region]
      if (continentId) {
        counts[continentId]++
      } else {
        unmapped++
      }
    }

    // Filter promotions by selected continent
    let filtered: typeof promotions
    if (selectedContinent === 'all') {
      filtered = promotions
    } else {
      const continent = CONTINENTS.find(c => c.id === selectedContinent)
      const validRegions = new Set(continent?.regions || [])
      filtered = promotions.filter(p => validRegions.has(p.region || ''))
    }

    // Group by sub-region (or by country for UK/Europe)
    const useCountryGrouping = selectedContinent === 'uk-europe'
    const byGroup: Record<string, typeof promotions> = {}
    for (const promo of filtered) {
      let groupKey: string
      if (useCountryGrouping) {
        const rawCountry = promo.country || 'Other'
        groupKey = COUNTRY_NORMALIZE[rawCountry] || rawCountry
      } else {
        groupKey = promo.region || 'Other'
      }
      if (!byGroup[groupKey]) byGroup[groupKey] = []
      byGroup[groupKey].push(promo)
    }

    // Sort groups
    const sortedGroups = Object.keys(byGroup).sort((a, b) => {
      if (useCountryGrouping) {
        // United Kingdom first, then alphabetical
        if (a === 'United Kingdom') return -1
        if (b === 'United Kingdom') return 1
        return a.localeCompare(b)
      }
      const aIndex = REGION_ORDER.indexOf(a)
      const bIndex = REGION_ORDER.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    const allCounts: Record<string, number> = { ...counts, all: promotions.length }

    return {
      filteredByRegion: sortedGroups.map(group => ({ region: group, promotions: byGroup[group] })),
      continentCounts: allCounts,
      filteredCount: filtered.length,
    }
  }, [promotions, selectedContinent])

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return promotions.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q))
    )
  }, [promotions, searchQuery])

  const isSearching = searchQuery.length >= 2

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Promotions</h1>
            <p className="text-foreground-muted">
              Independent wrestling promotions around the world
            </p>
          </div>
          <RequestPageButton />
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promotions by name or location..."
            className="w-full md:w-96 pl-12 pr-4 py-3 rounded-xl bg-background-secondary border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder-foreground-muted"
          />
        </div>

        {/* Continent Filter Buttons */}
        {!isSearching && <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedContinent('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              selectedContinent === 'all'
                ? 'bg-accent text-white border-accent'
                : 'bg-background-secondary border-border text-foreground-muted hover:border-accent/50 hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            All
            {!loading && <span className="opacity-70">({continentCounts.all})</span>}
          </button>
          {CONTINENTS.map(continent => (
            <button
              key={continent.id}
              onClick={() => setSelectedContinent(continent.id)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                selectedContinent === continent.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-background-secondary border-border text-foreground-muted hover:border-accent/50 hover:text-foreground'
              }`}
            >
              {continent.label}
              {!loading && <span className="opacity-70 ml-1">({continentCounts[continent.id] || 0})</span>}
            </button>
          ))}
        </div>}

        {/* Search Results */}
        {isSearching ? (
          <div>
            <p className="text-sm text-foreground-muted mb-4">
              {searchResults.length > 0 ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"` : `No results for "${searchQuery}"`}
            </p>
            {searchResults.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((promo: any) => (
                  <Link
                    key={promo.id}
                    href={`/promotions/${promo.slug}`}
                    className="card p-5 hover:border-accent/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {promo.logo_url ? (
                          <Image
                            src={promo.logo_url}
                            alt={promo.name}
                            width={64}
                            height={64}
                            className="object-contain"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full bg-background-tertiary flex items-center justify-center rounded-lg">
                            <Building2 className="w-8 h-8 text-foreground-muted" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                          {promo.name}
                        </h3>
                        {(promo.city || promo.state) && (
                          <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                            <MapPin className="w-3 h-3" />
                            {promo.city}{promo.city && promo.state && ', '}{promo.state}
                          </div>
                        )}
                        {promo.region && (
                          <span className="text-xs text-foreground-muted">{promo.region}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (<>

        {/* Results count + expand/collapse controls */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-foreground-muted">
              {filteredCount} promotion{filteredCount !== 1 ? 's' : ''}
            </p>
            {filteredByRegion.length > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <button
                  onClick={() => expandAll(filteredByRegion.map(g => g.region))}
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Expand all
                </button>
                <span className="text-border">|</span>
                <button
                  onClick={collapseAll}
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Most Active Promotions */}
        {!loading && mostActive.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-display font-bold">Most Active</h2>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {mostActive.map(({ promo, eventCount }) => (
                <Link
                  key={promo.id}
                  href={`/promotions/${promo.slug}`}
                  className="card p-4 hover:border-accent/50 transition-colors group text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center overflow-hidden mb-2">
                    {promo.logo_url ? (
                      <Image
                        src={promo.logo_url}
                        alt={promo.name}
                        width={48}
                        height={48}
                        className="object-contain"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-background-tertiary flex items-center justify-center rounded-lg">
                        <Building2 className="w-6 h-6 text-foreground-muted" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {promo.name}
                  </h3>
                  <span className="text-xs text-accent font-medium">{eventCount} Events</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((region) => (
              <div key={region}>
                <div className="h-6 w-32 skeleton mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 skeleton rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-32 skeleton" />
                          <div className="h-4 w-24 skeleton" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredByRegion.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">No promotions found</h3>
            <p className="text-foreground-muted mb-4">
              No promotions in this region yet.
            </p>
            <button
              onClick={() => setSelectedContinent('all')}
              className="text-accent hover:underline text-sm"
            >
              View All Regions
            </button>
          </div>
        ) : (
          /* Promotions grouped by sub-region — collapsible accordions */
          <div className="divide-y divide-border">
            {filteredByRegion.map(({ region, promotions: regionPromos }) => {
              const isExpanded = expandedGroups.has(region)
              return (
                <div key={region} className="py-4 first:pt-0">
                  <button
                    onClick={() => toggleGroup(region)}
                    className="flex items-center gap-2 w-full text-left group/header"
                  >
                    <ChevronDown
                      className={`w-5 h-5 text-foreground-muted transition-transform ${
                        isExpanded ? '' : '-rotate-90'
                      }`}
                    />
                    <h2 className="text-lg font-display font-bold text-foreground-muted group-hover/header:text-foreground transition-colors">
                      {region}
                    </h2>
                    <span className="text-sm text-foreground-muted opacity-70">
                      ({regionPromos.length})
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                      {regionPromos.map((promo: any) => (
                        <Link
                          key={promo.id}
                          href={`/promotions/${promo.slug}`}
                          className="card p-5 hover:border-accent/50 transition-colors group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {promo.logo_url ? (
                                <Image
                                  src={promo.logo_url}
                                  alt={promo.name}
                                  width={64}
                                  height={64}
                                  className="object-contain"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="w-full h-full bg-background-tertiary flex items-center justify-center rounded-lg">
                                  <Building2 className="w-8 h-8 text-foreground-muted" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                                {promo.name}
                              </h3>

                              {(promo.city || promo.state) && (
                                <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {promo.city}{promo.city && promo.state && ', '}{promo.state}
                                </div>
                              )}

                              {promo.twitter_handle && (
                                <div className="mt-2">
                                  <span className="text-foreground-muted text-xs">
                                    @{promo.twitter_handle}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </>)}
      </div>
    </div>
  )
}
