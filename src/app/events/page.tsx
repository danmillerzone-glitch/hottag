'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import { Calendar, ChevronDown, X, MapPin, Globe } from 'lucide-react'

// Regions for filtering
const REGIONS = [
  { id: 'usa', label: 'United States', filter: { country: 'USA' } },
  { id: 'canada', label: 'Canada', filter: { country: 'Canada' } },
  { id: 'mexico', label: 'Mexico', filter: { country: 'Mexico' } },
  { id: 'japan', label: 'Japan', filter: { country: 'Japan' } },
  { id: 'uk', label: 'United Kingdom', filter: { countries: ['UK', 'England', 'Scotland', 'Wales', 'Northern Ireland'] } },
  { id: 'europe', label: 'Europe', filter: { countries: ['Germany', 'Deutschland', 'France', 'Italy', 'Spain', 'Austria', 'Switzerland', 'Netherlands', 'Belgium', 'Poland', 'Czech Republic', 'Sweden', 'Norway', 'Finland', 'Denmark', 'Ireland', 'Portugal', 'Romania', 'Hungary', 'Croatia', 'Serbia', 'Greece', 'Turkey'] } },
  { id: 'australia', label: 'Australia & NZ', filter: { countries: ['Australia', 'New Zealand'] } },
  { id: 'latinamerica', label: 'Latin America', filter: { countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'] } },
  { id: 'asia', label: 'Asia', filter: { countries: ['India', 'China', 'South Korea', 'Korea', 'Philippines', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Taiwan'] } },
]

// Full US state abbreviation to name mapping
const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.', PR: 'Puerto Rico',
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [availableStates, setAvailableStates] = useState<string[]>([])
  
  const supabase = createClient()
  const fetchIdRef = useRef(0)

  useEffect(() => {
    fetchEvents()
  }, [selectedRegion, selectedState, timeFilter])

  async function fetchEvents() {
    // Stale-response guard: if filters change mid-flight, discard the old response
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    
    const todayStr = getTodayHawaii()
    const todayDate = new Date(todayStr + 'T12:00:00')
    let endDate: Date | null = null

    if (timeFilter === 'week') {
      endDate = new Date(todayDate)
      endDate.setDate(endDate.getDate() + 7)
    } else if (timeFilter === 'month') {
      endDate = new Date(todayDate)
      endDate.setMonth(endDate.getMonth() + 1)
    }

    let query = supabase
      .from('events')
      .select(`
        *,
        promotions (id, name, slug, logo_url)
      `)
      .gte('event_date', todayStr)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(200)
    
    if (endDate) {
      query = query.lte('event_date', endDate.toISOString().split('T')[0])
    }
    
    // Apply region filter
    if (selectedRegion) {
      const region = REGIONS.find(r => r.id === selectedRegion)
      if (region) {
        if ('country' in region.filter) {
          query = query.eq('country', region.filter.country)
        } else if ('countries' in region.filter) {
          query = query.in('country', region.filter.countries)
        }
      }
    }

    // Apply state filter (only for USA)
    if (selectedState) {
      query = query.eq('state', selectedState)
    }
    
    const { data, error } = await query

    // Discard if a newer fetch was triggered while this one was in-flight
    if (fetchId !== fetchIdRef.current) return

    if (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } else {
      const mappedEvents = data.map((e: any) => ({
        ...e,
        attending_count: e.real_attending_count || e.attending_count || 0,
        interested_count: e.real_interested_count || e.interested_count || 0
      }))
      setEvents(mappedEvents)
      
      // Get unique US states for dropdown (from current results)
      if ((!selectedRegion || selectedRegion === 'usa') && !selectedState) {
        const stateSet = new Set<string>()
        data.forEach((e: any) => {
          if (e.state && US_STATES[e.state]) stateSet.add(e.state)
        })
        setAvailableStates(Array.from(stateSet).sort((a, b) => (US_STATES[a] || a).localeCompare(US_STATES[b] || b)))
      }
    }
    
    setLoading(false)
  }

  // Memoize month grouping — avoids re-computation on filter dropdown toggles
  const byMonth = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    events.forEach((event) => {
      const date = new Date(event.event_date + 'T00:00:00')
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(event)
    })
    return grouped
  }, [events])

  const getStateName = (abbrev: string) => {
    return US_STATES[abbrev] || abbrev
  }

  const getRegionLabel = (id: string) => {
    return REGIONS.find(r => r.id === id)?.label || id
  }

  const handleRegionSelect = (regionId: string | null) => {
    setSelectedRegion(regionId)
    if (regionId !== 'usa') setSelectedState(null)
    setShowRegionDropdown(false)
  }

  const isUSA = !selectedRegion || selectedRegion === 'usa'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Events</h1>
          <p className="text-foreground-muted">
            Upcoming independent wrestling events around the world
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Region Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowRegionDropdown(!showRegionDropdown); setShowStateDropdown(false) }}
              aria-expanded={showRegionDropdown}
              aria-haspopup="listbox"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${
                selectedRegion
                  ? 'bg-accent/20 text-accent border-accent/50'
                  : 'bg-background-secondary border-border hover:border-accent/50'
              }`}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              {selectedRegion ? getRegionLabel(selectedRegion) : 'All Regions'}
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
            
            {showRegionDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRegionDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-56 bg-background-secondary border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => handleRegionSelect(null)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-background-tertiary text-sm ${!selectedRegion ? 'text-accent' : ''}`}
                  >
                    All Regions
                  </button>
                  <div className="border-t border-border" />
                  {REGIONS.map(region => (
                    <button
                      key={region.id}
                      onClick={() => handleRegionSelect(region.id)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-background-tertiary text-sm ${selectedRegion === region.id ? 'text-accent' : ''}`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* State Filter - only show for USA */}
          {isUSA && (
            <div className="relative">
              <button
                onClick={() => { setShowStateDropdown(!showStateDropdown); setShowRegionDropdown(false) }}
                aria-expanded={showStateDropdown}
                aria-haspopup="listbox"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${
                  selectedState
                    ? 'bg-accent/20 text-accent border-accent/50'
                    : 'bg-background-secondary border-border hover:border-accent/50'
                }`}
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {selectedState ? getStateName(selectedState) : 'All States'}
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              
              {showStateDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStateDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background-secondary border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedState(null); setShowStateDropdown(false) }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-background-tertiary text-sm ${!selectedState ? 'text-accent' : ''}`}
                    >
                      All States
                    </button>
                    <div className="border-t border-border" />
                    <div className="p-1">
                      {availableStates
                        .map(abbrev => ({ abbrev, name: US_STATES[abbrev] || abbrev }))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(state => (
                          <button
                            key={state.abbrev}
                            onClick={() => { setSelectedState(state.abbrev); if (!selectedRegion) setSelectedRegion('usa'); setShowStateDropdown(false) }}
                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-background-tertiary ${selectedState === state.abbrev ? 'text-accent' : ''}`}
                          >
                            {state.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Time Filters */}
          <button
            onClick={() => setTimeFilter('all')}
            aria-pressed={timeFilter === 'all'}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              timeFilter === 'all'
                ? 'bg-accent/20 text-accent border-accent/50'
                : 'bg-background-secondary border-border hover:border-accent/50 text-foreground-muted'
            }`}
          >
            All Events
          </button>
          
          <button
            onClick={() => setTimeFilter('week')}
            aria-pressed={timeFilter === 'week'}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              timeFilter === 'week'
                ? 'bg-accent/20 text-accent border-accent/50'
                : 'bg-background-secondary border-border hover:border-accent/50 text-foreground-muted'
            }`}
          >
            This Week
          </button>
          
          <button
            onClick={() => setTimeFilter('month')}
            aria-pressed={timeFilter === 'month'}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              timeFilter === 'month'
                ? 'bg-accent/20 text-accent border-accent/50'
                : 'bg-background-secondary border-border hover:border-accent/50 text-foreground-muted'
            }`}
          >
            This Month
          </button>
          
          <Link 
            href="/map"
            className="px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors text-sm text-foreground-muted"
          >
            Near Me
          </Link>
          
          {/* Clear filters */}
          {(selectedRegion || selectedState || timeFilter !== 'all') && (
            <button
              onClick={() => { setSelectedRegion(null); setSelectedState(null); setTimeFilter('all') }}
              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-foreground-muted mb-6" aria-live="polite" aria-atomic="true">
            {events.length} {events.length === 1 ? 'event' : 'events'} found
            {selectedRegion && ` in ${getRegionLabel(selectedRegion)}`}
            {selectedState && ` · ${getStateName(selectedState)}`}
            {timeFilter === 'week' && ' this week'}
            {timeFilter === 'month' && ' this month'}
          </p>
        )}

        {/* Events List */}
        {loading ? (
          <div className="space-y-10">
            {[1, 2].map((month) => (
              <div key={month}>
                <div className="h-6 w-40 skeleton mb-4" />
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <PosterEventCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-foreground-muted mb-4">
              No upcoming events match your filters.
            </p>
            <button
              onClick={() => { setSelectedRegion(null); setSelectedState(null); setTimeFilter('all') }}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byMonth).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-xl font-display font-semibold mb-4 text-foreground-muted sticky top-14 md:top-16 bg-background py-2 z-10">
                  {month}
                </h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {monthEvents.map((event: any) => (
                    <PosterEventCard key={event.id} event={event} />
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
