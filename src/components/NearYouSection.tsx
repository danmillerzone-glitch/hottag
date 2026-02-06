'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { EventCard, EventCardSkeleton } from '@/components/EventCard'
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
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading')
  const [radius, setRadius] = useState(defaultRadius)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserCoords(coords)
        setLocationStatus('granted')
        fetchNearbyEvents(coords, radius)
      },
      () => {
        setLocationStatus('denied')
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    if (userCoords) {
      fetchNearbyEvents(userCoords, radius)
    }
  }, [radius])

  async function fetchNearbyEvents(coords: { lat: number; lng: number }, radiusMiles: number) {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('events_with_counts')
      .select(`
        *,
        promotions (id, name, slug, logo_url)
      `)
      .gte('event_date', today)
      .eq('status', 'upcoming')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('event_date', { ascending: true })
      .limit(100)

    if (data) {
      const withDistance = data
        .map((e: any) => ({
          ...e,
          attending_count: e.real_attending_count || 0,
          interested_count: e.real_interested_count || 0,
          distance: calculateDistance(coords.lat, coords.lng, e.latitude, e.longitude),
        }))
        .filter((e: any) => e.distance <= radiusMiles)
        .sort((a: any, b: any) => a.distance - b.distance)

      setEvents(withDistance)
    }
    setLoading(false)
  }

  // Don't render anything if location is denied/unavailable
  if (locationStatus === 'denied' || locationStatus === 'unavailable') {
    return null
  }

  // Don't show section if no nearby events
  if (!loading && events.length === 0 && locationStatus === 'granted') {
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
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.slice(0, 8).map((event) => (
              <div key={event.id} className="relative">
                <EventCard event={event} />
                <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                  {event.distance < 1 ? '<1' : Math.round(event.distance)} mi
                </span>
              </div>
            ))}
          </div>
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
