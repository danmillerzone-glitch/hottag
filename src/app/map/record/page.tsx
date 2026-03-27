'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getTodayHawaii } from '@/lib/utils'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Region viewport definitions: [lng, lat, zoom]
const REGIONS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  us:        { center: [-95.7, 38.5],   zoom: 4.2,  label: 'United States' },
  northeast: { center: [-74.5, 41.5],   zoom: 6.2,  label: 'Northeast' },
  southeast: { center: [-83.5, 33.0],   zoom: 5.5,  label: 'Southeast' },
  midwest:   { center: [-89.0, 41.0],   zoom: 5.5,  label: 'Midwest' },
  texas:     { center: [-99.0, 31.5],   zoom: 5.5,  label: 'Texas & Southwest' },
  westcoast: { center: [-120.5, 37.5],  zoom: 5.5,  label: 'West Coast' },
  europe:    { center: [-1.5, 52.5],    zoom: 4.5,  label: 'UK & Europe' },
  japan:     { center: [138.0, 36.5],   zoom: 5.5,  label: 'Japan' },
}

export default function MapRecordPage() {
  const searchParams = useSearchParams()
  const region = searchParams.get('region') || 'us'
  const regionConfig = REGIONS[region] || REGIONS.us

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)

  // Fetch events and render pins
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: regionConfig.center,
      zoom: regionConfig.zoom,
      interactive: false,
      attributionControl: false,
    })

    map.current.on('load', async () => {
      const supabase = (await import('@/lib/supabase-browser')).createClient()
      const today = getTodayHawaii()
      const { data } = await supabase
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

      const allEvents = data || []

      // Filter to "this weekend" only (Friday–Sunday)
      const todayDate = new Date(today + 'T12:00:00')
      const dayOfWeek = todayDate.getDay() // 0=Sun, 6=Sat
      const fri = new Date(todayDate)
      if (dayOfWeek < 5) fri.setDate(fri.getDate() + (5 - dayOfWeek))
      else if (dayOfWeek > 5) fri.setDate(fri.getDate() - (dayOfWeek - 5))
      const sun = new Date(fri)
      sun.setDate(sun.getDate() + 2)
      const friStr = fri.toISOString().slice(0, 10)
      const sunStr = sun.toISOString().slice(0, 10)
      const events = allEvents.filter(e => e.event_date >= friStr && e.event_date <= sunStr)

      const pinSize = 32
      const pinOpacity = 1.0

      // Group by proximity
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

        const el = document.createElement('div')
        el.className = 'event-marker'

        const count = locationEvents.length > 1 ? locationEvents.length : ''

        el.innerHTML = `
          <div class="marker-dot marker-pulse" style="
            width: ${pinSize}px;
            height: ${pinSize}px;
            opacity: ${pinOpacity};
            font-size: 12px;
          ">${count}</div>
        `

        new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!)
      })

      // Signal to Puppeteer that we're ready
      setReady(true)
      ;(window as any).__MAP_READY__ = true
    })

    return () => {
      if (map.current) { map.current.remove(); map.current = null }
    }
  }, [regionConfig])

  return (
    <div className="w-[1920px] h-[1080px] relative overflow-hidden bg-[#14181c]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Region label - bottom left */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="text-white/80 text-lg font-medium tracking-wide uppercase">
          {regionConfig.label}
        </div>
      </div>

      {/* Hot Tag branding - top right */}
      <div className="absolute top-8 right-8 z-10 flex items-center gap-3">
        <div className="text-2xl font-display font-bold text-white">
          HOT<span className="text-accent">TAG</span>
        </div>
      </div>

      {/* Date range - bottom right */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="text-white/60 text-sm font-medium">
          This Weekend
        </div>
      </div>

      {/* Ready indicator for Puppeteer (hidden) */}
      {ready && <div id="map-ready" className="hidden" />}

      <style jsx global>{`
        body { margin: 0; padding: 0; overflow: hidden; background: #14181c; }
        .event-marker { cursor: default; }
        .marker-dot {
          border-radius: 50%;
          background: #ff6b35;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          box-shadow: 0 0 8px rgba(255, 107, 53, 0.4);
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
        /* Hide mapbox controls and attribution */
        .mapboxgl-ctrl-top-right,
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right { display: none !important; }
      `}</style>
    </div>
  )
}
