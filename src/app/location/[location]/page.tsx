import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MapPin, Calendar, Users, ChevronLeft } from 'lucide-react'
import EventCard from '@/components/EventCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LocationPageProps {
  params: { location: string }
}

// US States mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
}

const STATE_ABBREVS = Object.keys(STATE_NAMES)

async function getEventsByLocation(location: string) {
  const decodedLocation = decodeURIComponent(location).replace(/-/g, ' ')
  const today = new Date().toISOString().split('T')[0]
  
  // Check if it's a state abbreviation
  const upperLocation = decodedLocation.toUpperCase()
  const isState = STATE_ABBREVS.includes(upperLocation)
  
  let query = supabase
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
    .gte('event_date', today)
    .eq('status', 'upcoming')
    .order('event_date', { ascending: true })
  
  if (isState) {
    query = query.eq('state', upperLocation)
  } else {
    // Search by city (case insensitive)
    query = query.ilike('city', decodedLocation)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching events by location:', error)
    return { events: [], isState, locationName: decodedLocation }
  }
  
  // Map real counts
  const events = data.map((e: any) => ({
    ...e,
    attending_count: e.real_attending_count || 0,
    interested_count: e.real_interested_count || 0
  }))
  
  const locationName = isState ? STATE_NAMES[upperLocation] : decodedLocation
  
  return { events, isState, locationName }
}

export async function generateMetadata({ params }: LocationPageProps) {
  const { locationName, events } = await getEventsByLocation(params.location)
  
  return {
    title: `Wrestling Events in ${locationName} | Hot Tag`,
    description: `Find ${events.length} upcoming indie wrestling events in ${locationName}.`,
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { events, isState, locationName } = await getEventsByLocation(params.location)
  
  // Get unique cities if showing a state
  let cities: string[] = []
  if (isState) {
    const citySet = new Set<string>()
    events.forEach((e: any) => {
      if (e.city) citySet.add(e.city)
    })
    cities = Array.from(citySet)
  }
  
  // Group events by month
  const eventsByMonth: Record<string, any[]> = {}
  events.forEach((event: any) => {
    const month = new Date(event.event_date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
    if (!eventsByMonth[month]) {
      eventsByMonth[month] = []
    }
    eventsByMonth[month].push(event)
  })

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
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">{locationName}</h1>
              <p className="text-foreground-muted">
                {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
          
          {/* City links for state pages */}
          {isState && cities.length > 1 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground-muted mb-2">Cities</h3>
              <div className="flex flex-wrap gap-2">
                {cities.sort().map((city: string) => (
                  <Link
                    key={city}
                    href={`/location/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="px-3 py-1 rounded-full bg-background-tertiary hover:bg-accent/20 hover:text-accent transition-colors text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
            <p className="text-foreground-muted">
              We don't have any events listed for {locationName} yet.
            </p>
            <Link href="/events" className="btn btn-primary mt-4">
              Browse All Events
            </Link>
          </div>
        ) : (
          Object.entries(eventsByMonth).map(([month, monthEvents]) => (
            <div key={month} className="mb-8">
              <h2 className="text-xl font-display font-bold mb-4">{month}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {monthEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
