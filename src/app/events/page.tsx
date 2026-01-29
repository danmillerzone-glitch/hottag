import { Suspense } from 'react'
import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/supabase'
import { EventCard, EventCardSkeleton } from '@/components/EventCard'
import { Calendar, Filter, ChevronDown } from 'lucide-react'

export const revalidate = 300

async function EventsList() {
  const events = await getUpcomingEvents(100)

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
        <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
        <p className="text-foreground-muted">
          Check back soon for new shows!
        </p>
      </div>
    )
  }

  // Group events by month
  const byMonth: Record<string, typeof events> = {}
  events.forEach((event) => {
    const date = new Date(event.event_date + 'T00:00:00')
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!byMonth[monthKey]) byMonth[monthKey] = []
    byMonth[monthKey].push(event)
  })

  return (
    <div className="space-y-10">
      {Object.entries(byMonth).map(([month, monthEvents]) => (
        <div key={month}>
          <h2 className="text-xl font-display font-semibold mb-4 text-foreground-muted sticky top-14 md:top-16 bg-background py-2 z-10">
            {month}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EventsListSkeleton() {
  return (
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
  )
}

export default function EventsPage() {
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors text-sm">
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <button className="px-4 py-2 rounded-lg bg-accent/20 text-accent border border-accent/50 text-sm font-medium">
            All Events
          </button>
          
          <button className="px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors text-sm text-foreground-muted">
            This Week
          </button>
          
          <button className="px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors text-sm text-foreground-muted">
            This Month
          </button>
          
          <Link 
            href="/map"
            className="px-4 py-2 rounded-lg bg-background-secondary border border-border hover:border-accent/50 transition-colors text-sm text-foreground-muted"
          >
            Near Me
          </Link>
        </div>

        {/* Events List */}
        <Suspense fallback={<EventsListSkeleton />}>
          <EventsList />
        </Suspense>
      </div>
    </div>
  )
}
