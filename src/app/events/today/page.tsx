'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TodayEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = getTodayHawaii()

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          promotions (id, name, slug, logo_url)
        `)
        .eq('event_date', today)
        .eq('status', 'upcoming')
        .order('event_time', { ascending: true })

      if (data) {
        setEvents(data.map((e: any) => ({
          ...e,
          attending_count: e.real_attending_count || e.attending_count || 0,
          interested_count: e.real_interested_count || e.interested_count || 0,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const todayFormatted = new Date(getTodayHawaii() + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Today's Events</h1>
          <p className="text-foreground-muted">{todayFormatted}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <PosterEventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events today</h3>
            <p className="text-foreground-muted mb-4">
              Check back tomorrow or browse all upcoming events.
            </p>
            <Link href="/events" className="btn btn-primary">
              Browse All Events
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground-muted mb-6">
              {events.length} {events.length === 1 ? 'show' : 'shows'} tonight
            </p>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {events.map((event: any) => (
                <PosterEventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
