'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import EventCarousel from '@/components/EventCarousel'
import { Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ThisWeekendSection() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('This Weekend')

  useEffect(() => {
    fetchWeekendEvents()
  }, [])

  async function fetchWeekendEvents() {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

    let startDate: Date
    let endDate: Date

    // If it's Thursday-Sunday, show "This Weekend" (Thu-Sun)
    // If it's Mon-Wed, show "This Week" (today through Sunday)
    if (dayOfWeek >= 4 || dayOfWeek === 0) {
      // Thu-Sun: show through end of Sunday
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      
      // Find next Sunday
      endDate = new Date(now)
      if (dayOfWeek === 0) {
        // Already Sunday, show today
        endDate.setHours(23, 59, 59, 999)
      } else {
        endDate.setDate(endDate.getDate() + (7 - dayOfWeek))
        endDate.setHours(23, 59, 59, 999)
      }
      setLabel('This Weekend')
    } else {
      // Mon-Wed: show through upcoming Sunday
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(now)
      endDate.setDate(endDate.getDate() + (7 - dayOfWeek))
      endDate.setHours(23, 59, 59, 999)
      setLabel('This Week')
    }

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('events')
      .select('*, promotions (id, name, slug, logo_url)')
      .gte('event_date', startStr)
      .lte('event_date', endStr)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(8)

    if (data) {
      const mapped = data.map((e: any) => ({
        ...e,
        attending_count: e.real_attending_count || 0,
        interested_count: e.real_interested_count || 0,
      }))
      setEvents(mapped)
    }
    setLoading(false)
  }

  if (!loading && events.length === 0) return null

  return (
    <section className="py-10 bg-gradient-to-t from-purple-500/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            {label}
          </h2>
          <Link href="/events" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
            All events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <EventCarousel events={[]} loading={true} skeletonCount={6} />
        ) : (
          <EventCarousel events={events} />
        )}
      </div>
    </section>
  )
}
