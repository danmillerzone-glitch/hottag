'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { EventCard, EventCardSkeleton } from '@/components/EventCard'
import { Calendar, Filter, ChevronDown, X, MapPin } from 'lucide-react'

// Popular states for quick filters
const POPULAR_STATES = [
  { abbrev: 'CA', name: 'California' },
  { abbrev: 'TX', name: 'Texas' },
  { abbrev: 'NY', name: 'New York' },
  { abbrev: 'FL', name: 'Florida' },
  { abbrev: 'PA', name: 'Pennsylvania' },
  { abbrev: 'IL', name: 'Illinois' },
  { abbrev: 'NV', name: 'Nevada' },
  { abbrev: 'GA', name: 'Georgia' },
  { abbrev: 'NJ', name: 'New Jersey' },
  { abbrev: 'OH', name: 'Ohio' },
]

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [availableStates, setAvailableStates] = useState<string[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [selectedState, timeFilter])

  async function fetchEvents() {
    setLoading(true)
    
    const today = new Date()
    let endDate: Date | null = null
    
    if (timeFilter === 'week') {
      endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 7)
    } else if (timeFilter === 'month') {
      endDate = new Date(today)
      endDate.setMonth(endDate.getMonth() + 1)
    }
    
    let query = supabase
      .from('events_with_counts')
      .select(`
        *,
        promotions (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .gte('event_date', today.toISOString().split('T')[0])
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(200)
    
    if (endDate) {
      query = query.lte('event_date', endDate.toISOString().split('T')[0])
    }
    
    if (selectedState) {
      query = query.eq('state', selectedState)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } else {
      // Map real counts
      const mappedEvents = data.map((e: any) => ({
        ...e,
        attending_count: e.real_attending_count || 0,
        interested_count: e.real_interested_count || 0
      }))
      setEvents(mappedEvents)
      
      // Get unique states for dropdown
      if (!selectedState) {
        const states = [...new Set(data.map((e: any) => e.state).filter(Boolean))] as string[]
        setAvailableStates(states.sort())
      }
    }
    
    setLoading(false)
  }

  // Group events by month
  const byMonth: Record<string, any[]> = {}
  events.forEach((event) => {
    const date = new Date(event.event_date + 'T00:00:00')
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!byMonth[monthKey]) byMonth[monthKey] = []
    byMonth[monthKey].push(event)
  })

  const getStateName = (abbrev: string) => {
    const state = POPULAR_STATES.find(s => s.abbrev === abbrev)
    return state?.name || abbrev
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Events</h1>
          <p className="text-foreground-muted">
            Upcoming independent wrestling events across the United States
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* State Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${
                selectedState 
                  ? 'bg-accent/20 text-accent border-accent/50' 
                  : 'bg-background-secondary border-border hover:border-accent/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {selectedState ? getStateName(selectedState) : 'All States'}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showStateDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStateDropdown(false)} 
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-background-secondary border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedState(null); setShowStateDropdown(false) }}
                    className={`w-full text-left px-4 py-2 hover:bg-background-tertiary ${!selectedState ? 'text-accent' : ''}`}
                  >
                    All States
                  </button>
                  <div className="border-t border-border" />
                  <div className="p-2">
                    <div className="text-xs text-foreground-muted px-2 py-1">Popular</div>
                    {POPULAR_STATES.map(state => (
                      <button
                        key={state.abbrev}
                        onClick={() => { setSelectedState(state.abbrev); setShowStateDropdown(false) }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-background-tertiary ${selectedState === state.abbrev ? 'text-accent' : ''}`}
                      >
                        {state.name}
                      </button>
                    ))}
                  </div>
                  {availableStates.filter(s => !POPULAR_STATES.some(ps => ps.abbrev === s)).length > 0 && (
                    <>
                      <div className="border-t border-border" />
                      <div className="p-2">
                        <div className="text-xs text-foreground-muted px-2 py-1">Other States</div>
                        {availableStates
                          .filter(s => !POPULAR_STATES.some(ps => ps.abbrev === s))
                          .map(state => (
                            <button
                              key={state}
                              onClick={() => { setSelectedState(state); setShowStateDropdown(false) }}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-background-tertiary ${selectedState === state ? 'text-accent' : ''}`}
                            >
                              {state}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Time Filters */}
          <button 
            onClick={() => setTimeFilter('all')}
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
          {(selectedState || timeFilter !== 'all') && (
            <button
              onClick={() => { setSelectedState(null); setTimeFilter('all') }}
              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-foreground-muted mb-6">
            {events.length} {events.length === 1 ? 'event' : 'events'} found
            {selectedState && ` in ${getStateName(selectedState)}`}
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
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
              {selectedState 
                ? `No upcoming events in ${getStateName(selectedState)}.`
                : 'No upcoming events match your filters.'}
            </p>
            <button
              onClick={() => { setSelectedState(null); setTimeFilter('all') }}
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {monthEvents.map((event: any) => (
                    <EventCard key={event.id} event={event} />
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
