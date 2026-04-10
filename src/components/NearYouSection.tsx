'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii, getUserLocation } from '@/lib/utils'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import EventCarousel from '@/components/EventCarousel'
import { MapPin, Navigation, ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface NearYouProps {
  defaultRadius?: number
}

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

export default function NearYouSection({ defaultRadius = 100 }: NearYouProps) {
  const supabase = createClient()
  const [allEvents, setAllEvents] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading')
  const [radius, setRadius] = useState(defaultRadius)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getUserLocation().then(({ coords, status }) => {
      setLocationStatus(status)
      if (coords) {
        setUserCoords(coords)
        fetchEvents(coords)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function fetchEvents(coords: { lat: number; lng: number }) {
    setLoading(true)
    const today = getTodayHawaii()

    const { data } = await supabase
      .from('events')
      .select('*, promotions (id, name, slug, logo_url)')
      .gte('event_date', today)
      .eq('status', 'upcoming')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('event_date', { ascending: true })
      .limit(500)

    if (data) {
      // Batch-fetch co-promoters
      const eventIds = data.map((e: any) => e.id)
      if (eventIds.length > 0) {
        const { data: eventPromos } = await supabase
          .from('event_promotions')
          .select('event_id, promotion_id, promotions(id, name, slug, logo_url)')
          .in('event_id', eventIds)

        const promoMap = new Map<string, any[]>()
        for (const ep of (eventPromos || [])) {
          if (!promoMap.has(ep.event_id)) promoMap.set(ep.event_id, [])
          promoMap.get(ep.event_id)!.push(ep)
        }

        const withDistance = data.map((e: any) => ({
          ...e,
          attending_count: e.real_attending_count || 0,
          interested_count: e.real_interested_count || 0,
          distance: calculateDistance(coords.lat, coords.lng, e.latitude, e.longitude),
          event_promotions: promoMap.get(e.id) || [],
        }))
        setAllEvents(withDistance)
      }
    }
    setLoading(false)
  }

  // Filter and sort by radius — no DB call when radius changes
  const events = useMemo(() => {
    if (!allEvents) return []
    return allEvents
      .filter((e: any) => e.distance <= radius)
      .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date))
  }, [allEvents, radius])

  // Don't show section if location was granted but no events exist at all (even at max radius)
  if (!loading && locationStatus === 'granted' && allEvents !== null && allEvents.length === 0) {
    return null
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-400" />
            Near You
          </h2>
          {locationStatus === 'granted' && (
            <div className="flex items-center gap-3">
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
              <Link href="/map" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
                Map <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {(locationStatus === 'denied' || locationStatus === 'unavailable') ? (
          <div className="card p-6 text-center max-w-lg mx-auto">
            <MapPin className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <p className="text-foreground-muted mb-4">
              Enable location access to see events near you.
            </p>
            <button
              onClick={() => {
                getUserLocation().then(({ coords, status }) => {
                  setLocationStatus(status)
                  if (coords) {
                    setUserCoords(coords)
                    fetchEvents(coords)
                  }
                })
              }}
              className="btn btn-secondary text-sm"
            >
              <Navigation className="w-4 h-4 mr-1.5" />
              Enable Location
            </button>
          </div>
        ) : loading ? (
          <EventCarousel events={[]} loading={true} skeletonCount={6} />
        ) : events.length === 0 ? (
          <p className="text-foreground-muted text-center py-4">
            No events within {radius} miles. Try increasing the radius.
          </p>
        ) : (
          <EventCarousel
            events={events.slice(0, 12)}
            badge={(event) => (
              <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 z-10">
                {event.distance < 1 ? '<1' : Math.round(event.distance)} mi
              </span>
            )}
          />
        )}

        {events.length > 8 && (
          <div className="mt-4 text-center">
            <Link href="/map" className="btn btn-secondary text-sm">
              <MapPin className="w-4 h-4 mr-1.5" />
              View all {events.length} events near you
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
