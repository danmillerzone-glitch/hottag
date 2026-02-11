import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MapPin, Calendar, Building2, ExternalLink, ChevronLeft } from 'lucide-react'
import EventCard from '@/components/EventCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VenuePageProps {
  params: { venue: string }
}

async function getEventsByVenue(venueSlug: string) {
  const venueName = decodeURIComponent(venueSlug).replace(/-/g, ' ')
  const today = new Date().toISOString().split('T')[0]
  
  // Search for events with this venue (case insensitive)
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      promotions (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .ilike('venue_name', venueName)
    .order('event_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching events by venue:', error)
    return { events: [], venueName, venueInfo: null }
  }
  
  // Map real counts
  const mappedEvents = events.map((e: any) => ({
    ...e,
    attending_count: e.real_attending_count || 0,
    interested_count: e.real_interested_count || 0
  }))
  
  // Get venue info from first event
  const venueInfo = events.length > 0 ? {
    name: events[0].venue_name,
    city: events[0].city,
    state: events[0].state,
  } : null
  
  // Split into upcoming and past
  const upcoming = mappedEvents.filter((e: any) => e.event_date >= today)
  const past = mappedEvents.filter((e: any) => e.event_date < today)
  
  return { 
    events: mappedEvents, 
    upcoming,
    past,
    venueName: venueInfo?.name || venueName, 
    venueInfo 
  }
}

export async function generateMetadata({ params }: VenuePageProps) {
  const { venueName, events, venueInfo } = await getEventsByVenue(params.venue)
  const location = venueInfo ? `${venueInfo.city}, ${venueInfo.state}` : ''
  
  return {
    title: `${venueName} - Wrestling Events | Hot Tag`,
    description: `Find wrestling events at ${venueName}${location ? ` in ${location}` : ''}. ${events.length} events listed.`,
  }
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { upcoming = [], past = [], venueName, venueInfo } = await getEventsByVenue(params.venue)
  
  const totalEvents = upcoming.length + past.length
  
  if (totalEvents === 0) {
    notFound()
  }

  // Google Maps URL
  const mapsQuery = venueInfo 
    ? `${venueName}, ${venueInfo.city}, ${venueInfo.state}`
    : venueName
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/events" 
            className="inline-flex items-center text-foreground-muted hover:text-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            All Events
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold">{venueName}</h1>
              {venueInfo && (venueInfo.city || venueInfo.state) && (
                <p className="text-foreground-muted mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venueInfo.city && (
                    <Link 
                      href={`/location/${encodeURIComponent(venueInfo.city.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="hover:text-accent hover:underline"
                    >
                      {venueInfo.city}
                    </Link>
                  )}
                  {venueInfo.city && venueInfo.state && ', '}
                  {venueInfo.state && (
                    <Link 
                      href={`/location/${venueInfo.state}`}
                      className="hover:text-accent hover:underline"
                    >
                      {venueInfo.state}
                    </Link>
                  )}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-foreground-muted">
                  {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Upcoming Events ({upcoming.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcoming.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-display font-bold mb-4 text-foreground-muted">
              Past Events ({past.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
              {past.slice(0, 8).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {past.length > 8 && (
              <p className="text-center text-foreground-muted mt-4">
                And {past.length - 8} more past events...
              </p>
            )}
          </div>
        )}

        {/* No upcoming events */}
        {upcoming.length === 0 && past.length > 0 && (
          <div className="text-center py-8 mb-8 card">
            <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
            <p className="text-foreground-muted">
              There are no upcoming events scheduled at this venue yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
