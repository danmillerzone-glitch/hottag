'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import EventCarousel from '@/components/EventCarousel'
import { Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function RecommendedSection() {
  const { user } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecommendations()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchRecommendations() {
    setLoading(true)
    const today = getTodayHawaii()
    const eventCols = `*, promotions (id, name, slug, logo_url)`

    // Fire first two queries in parallel
    const [{ data: followedPromos }, { data: attended }] = await Promise.all([
      supabase.from('user_follows_promotion').select('promotion_id').eq('user_id', user!.id),
      supabase.from('user_event_attendance').select('event_id').eq('user_id', user!.id),
    ])

    // Get regions of followed promotions for regional recommendations
    const followedPromoIds = (followedPromos || []).map((f: any) => f.promotion_id)
    const attendedEventIds = new Set((attended || []).map((a: any) => a.event_id))

    let regions: string[] = []
    let states: string[] = []

    if (followedPromoIds.length > 0) {
      const { data: promoData } = await supabase
        .from('promotions')
        .select('region, state')
        .in('id', followedPromoIds)

      if (promoData) {
        regions = Array.from(new Set(promoData.map((p: any) => p.region).filter(Boolean)))
        states = Array.from(new Set(promoData.map((p: any) => p.state).filter(Boolean)))
      }
    }

    // Strategy 1: Events from promotions in same region as your follows
    let recommendedEvents: any[] = []

    if (regions.length > 0) {
      // Find other promotions in same regions
      const { data: regionalPromos } = await supabase
        .from('promotions')
        .select('id')
        .in('region', regions)
        .not('id', 'in', `(${followedPromoIds.join(',')})`)

      if (regionalPromos && regionalPromos.length > 0) {
        const regionalPromoIds = regionalPromos.map((p: any) => p.id)
        
        const { data: regionalEvents } = await supabase
          .from('events')
          .select(eventCols)
          .in('promotion_id', regionalPromoIds)
          .gte('event_date', today)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true })
          .limit(12)

        if (regionalEvents) {
          recommendedEvents = regionalEvents.map((e: any) => ({
            ...e,
            attending_count: e.real_attending_count || 0,
            interested_count: e.real_interested_count || 0,
          }))
        }
      }
    }

    // Strategy 2: If not enough, add events in same states
    if (recommendedEvents.length < 4 && states.length > 0) {
      const { data: stateEvents } = await supabase
        .from('events')
        .select(eventCols)
        .in('state', states)
        .gte('event_date', today)
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true })
        .limit(12)

      if (stateEvents) {
        const existingIds = new Set(recommendedEvents.map((e: any) => e.id))
        for (const e of stateEvents) {
          if (!existingIds.has(e.id)) {
            recommendedEvents.push({
              ...e,
              attending_count: (e as any).real_attending_count || 0,
              interested_count: (e as any).real_interested_count || 0,
            })
            existingIds.add(e.id)
          }
        }
      }
    }

    // Strategy 3: Popular events the user hasn't marked
    if (recommendedEvents.length < 4) {
      const { data: popular } = await supabase
        .from('events')
        .select(eventCols)
        .gte('event_date', today)
        .eq('status', 'upcoming')
        .order('real_attending_count', { ascending: false })
        .limit(20)

      if (popular) {
        const existingIds = new Set(recommendedEvents.map((e: any) => e.id))
        for (const e of popular) {
          if (!existingIds.has(e.id) && !attendedEventIds.has(e.id)) {
            recommendedEvents.push({
              ...e,
              attending_count: (e as any).real_attending_count || 0,
              interested_count: (e as any).real_interested_count || 0,
            })
            existingIds.add(e.id)
          }
        }
      }
    }

    // Filter out events user already marked attendance for
    recommendedEvents = recommendedEvents.filter(e => !attendedEventIds.has(e.id))

    setEvents(recommendedEvents.slice(0, 8))
    setLoading(false)
  }

  if (!user) return null
  if (!loading && events.length === 0) return null

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Recommended For You
          </h2>
          <Link href="/events" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
            Browse all <ChevronRight className="w-4 h-4" />
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
