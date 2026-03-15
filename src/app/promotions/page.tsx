'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Building2, MapPin, Globe } from 'lucide-react'
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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContinent, setSelectedContinent] = useState<string>('north-america')

  useEffect(() => {
    async function fetchPromotions() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('promotions')
        .select('id, name, slug, logo_url, region, city, state, country, twitter_handle')
        .order('name')
        .limit(1000)

      if (error) {
        console.error('Error fetching promotions:', error)
        setPromotions([])
      } else {
        setPromotions(data || [])
      }
      setLoading(false)
    }
    fetchPromotions()
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

    // Group by region
    const byRegion: Record<string, typeof promotions> = {}
    for (const promo of filtered) {
      const region = promo.region || 'Other'
      if (!byRegion[region]) byRegion[region] = []
      byRegion[region].push(promo)
    }

    // Sort regions by predefined order
    const sortedRegions = Object.keys(byRegion).sort((a, b) => {
      const aIndex = REGION_ORDER.indexOf(a)
      const bIndex = REGION_ORDER.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    const allCounts: Record<string, number> = { ...counts, all: promotions.length }

    return {
      filteredByRegion: sortedRegions.map(region => ({ region, promotions: byRegion[region] })),
      continentCounts: allCounts,
      filteredCount: filtered.length,
    }
  }, [promotions, selectedContinent])

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

        {/* Continent Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
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
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-foreground-muted mb-6">
            {filteredCount} promotion{filteredCount !== 1 ? 's' : ''}
          </p>
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
          /* Promotions grouped by sub-region */
          <div className="space-y-12">
            {filteredByRegion.map(({ region, promotions: regionPromos }) => (
              <div key={region}>
                <h2 className="text-xl font-display font-bold mb-4 text-foreground-muted">
                  {region}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

                          <div className="flex items-center gap-3 mt-3">
                            {promo.twitter_handle && (
                              <span className="text-foreground-muted text-xs">
                                @{promo.twitter_handle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
