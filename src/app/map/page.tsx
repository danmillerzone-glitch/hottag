'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { formatEventDate, formatLocation } from '@/lib/utils'
import { MapPin, Calendar, List, X } from 'lucide-react'
import Link from 'next/link'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const DEFAULT_CENTER: [number, number] = [-95.7129, 37.0902]
const DEFAULT_ZOOM = 4
const USER_ZOOM = 9

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersAdded = useRef(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    async function fetchEvents() {
      const supabase = (await import('@/lib/supabase-browser')).createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, event_date, venue_name, city, state, country,
          latitude, longitude, poster_url, status,
          promotions (id, name, slug, logo_url)
        `)
        .eq('status', 'upcoming')
        .gte('event_date', today)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('event_date', { ascending: true })
        .limit(1000)

      if (error) {
        console.error('Map events error:', error)
        setEvents([])
      } else {
        setEvents(data || [])
      }
      setLoading(false)
    }
    fetchEvents()
  }, [])

  // Initialize map immediately without waiting for location
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    // Fly to user location AFTER map loads — no blocking
    map.current.on('load', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (map.current) {
              map.current.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: USER_ZOOM,
                speed: 1.5,
              })
            }
          },
          () => { /* denied or error — stay at default */ },
          { timeout: 8000 }
        )
      }
    })

    return () => {
      if (map.current) { map.current.remove(); map.current = null }
    }
  }, [])

  // Add markers when events load
  useEffect(() => {
    if (!map.current || events.length === 0 || markersAdded.current) return
    markersAdded.current = true

    const now = new Date()
    const msPerDay = 86400000

    function getUrgency(eventDate: string) {
      const date = new Date(eventDate + 'T12:00:00')
      const daysAway = Math.floor((date.getTime() - now.getTime()) / msPerDay)
      if (daysAway <= 7) return 'week'       // This week
      if (daysAway <= 30) return 'month'      // This month
      if (daysAway <= 60) return 'soon'       // 1-2 months
      return 'later'                           // 2+ months
    }

    // Urgency config: size (px), opacity, pulse animation
    const urgencyConfig = {
      week:  { size: 36, opacity: 1.0,  pulse: true  },
      month: { size: 28, opacity: 0.85, pulse: false },
      soon:  { size: 22, opacity: 0.65, pulse: false },
      later: { size: 16, opacity: 0.45, pulse: false },
    }

    // Group events by proximity — round to 3 decimal places (~111m)
    const locationGroups = new Map<string, any[]>()
    events.forEach(event => {
      const roundedLat = Math.round(event.latitude * 1000) / 1000
      const roundedLng = Math.round(event.longitude * 1000) / 1000
      const key = `${roundedLat},${roundedLng}`
      if (!locationGroups.has(key)) locationGroups.set(key, [])
      locationGroups.get(key)!.push(event)
    })

    locationGroups.forEach((locationEvents, key) => {
      const [lat, lng] = key.split(',').map(Number)
      const event = locationEvents[0]

      // Use the most urgent event in the group to determine marker style
      const urgencies = locationEvents.map((e: any) => getUrgency(e.event_date))
      const priority: ('week' | 'month' | 'soon' | 'later')[] = ['week', 'month', 'soon', 'later']
      const bestUrgency = priority.find(p => urgencies.includes(p)) || 'later'
      const config = urgencyConfig[bestUrgency as keyof typeof urgencyConfig]

      const el = document.createElement('div')
      el.className = 'event-marker'

      const count = locationEvents.length > 1 ? locationEvents.length : ''
      const fontSize = config.size < 24 ? '10px' : '12px'

      el.innerHTML = `
        <div class="marker-dot ${config.pulse ? 'marker-pulse' : ''}" style="
          width: ${config.size}px;
          height: ${config.size}px;
          opacity: ${config.opacity};
          font-size: ${fontSize};
        ">${count}</div>
      `

      const venueNames = Array.from(new Set(locationEvents.map((e: any) => e.venue_name).filter(Boolean)))
      const venueLabel = venueNames.length === 1 ? venueNames[0] : formatLocation(event.city, event.state)

      const popupContent = locationEvents.length > 1
        ? `<div class="p-4 max-w-xs">
            <h3 class="font-bold text-foreground mb-1">${locationEvents.length} Events</h3>
            <p class="text-foreground-muted text-sm mb-3">${venueLabel}</p>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              ${locationEvents.map((e: any) => `<a href="/events/${e.id}" class="block p-2 rounded bg-background-tertiary hover:bg-border transition-colors"><div class="font-medium text-sm text-foreground">${e.name}</div><div class="text-xs text-accent">${formatEventDate(e.event_date)}</div></a>`).join('')}
            </div></div>`
        : `<div class="p-4 max-w-xs">
            ${event.promotions ? `<div class="text-accent text-xs font-medium mb-1">${event.promotions.name}</div>` : ''}
            <h3 class="font-bold text-foreground mb-1">${event.name}</h3>
            <p class="text-foreground-muted text-sm mb-2">${formatEventDate(event.event_date)}</p>
            <p class="text-foreground-muted text-sm mb-3">${event.venue_name || formatLocation(event.city, event.state)}</p>
            <a href="/events/${event.id}" class="inline-block px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">View Event</a></div>`

      new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(map.current!)
    })
  }, [events])

  return (
    <div className="relative h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
      <div ref={mapContainer} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground-muted">Loading events...</p>
          </div>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button onClick={() => setShowList(!showList)} className="flex items-center gap-2 px-4 py-2 bg-background-secondary/95 backdrop-blur rounded-lg text-sm font-medium hover:bg-background-tertiary transition-colors">
          <List className="w-4 h-4" /> {showList ? 'Hide List' : 'Show List'}
        </button>
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <div className="px-4 py-2 bg-background-secondary/95 backdrop-blur rounded-lg text-sm">
          <span className="text-accent font-bold">{events.length}</span>{' '}
          <span className="text-foreground-muted">events on map</span>
        </div>
        {/* Legend */}
        <div className="px-4 py-3 bg-background-secondary/95 backdrop-blur rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-foreground-muted">This week</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent opacity-80" />
              <span className="text-[11px] text-foreground-muted">This month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-accent opacity-50" />
              <span className="text-[11px] text-foreground-muted">Later</span>
            </div>
          </div>
        </div>
      </div>
      {showList && (
        <div className="absolute top-0 right-0 bottom-0 w-full md:w-96 bg-background-secondary/95 backdrop-blur z-20 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold">Upcoming Events</h2>
            <button onClick={() => setShowList(false)} className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block p-4 rounded-lg bg-background hover:bg-background-tertiary transition-colors">
                {event.promotions && <div className="text-accent text-xs font-medium mb-1">{event.promotions.name}</div>}
                <h3 className="font-semibold text-foreground mb-1">{event.name}</h3>
                <div className="flex items-center gap-2 text-sm text-foreground-muted"><Calendar className="w-3 h-3" />{formatEventDate(event.event_date)}</div>
                <div className="flex items-center gap-2 text-sm text-foreground-muted mt-1"><MapPin className="w-3 h-3" />{formatLocation(event.city, event.state)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <style jsx global>{`
        .event-marker { cursor: pointer; }
        .marker-dot {
          border-radius: 50%;
          background: #ff6b35;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          box-shadow: 0 0 8px rgba(255, 107, 53, 0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .marker-dot:hover {
          transform: scale(1.2);
        }
        .marker-pulse {
          animation: markerPulse 2s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(255, 107, 53, 0.6);
        }
        @keyframes markerPulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.8), 0 0 40px rgba(255, 107, 53, 0.3);
            transform: scale(1.1);
          }
        }
        .marker-pulse:hover {
          animation: none;
          transform: scale(1.2);
        }
        .mapboxgl-popup-content { background: #1c2228 !important; border-radius: 12px !important; padding: 0 !important; color: #fff !important; }
        .mapboxgl-popup-tip { border-top-color: #1c2228 !important; }
        .mapboxgl-popup-close-button { color: #99aabb !important; font-size: 20px !important; padding: 8px 12px !important; }
        .mapboxgl-popup-close-button:hover { background: transparent !important; color: #fff !important; }
      `}</style>
    </div>
  )
}
