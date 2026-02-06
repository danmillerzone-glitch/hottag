'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { EventCard, EventCardSkeleton } from '@/components/EventCard'
import NearYouSection from '@/components/NearYouSection'
import ThisWeekendSection from '@/components/ThisWeekendSection'
import RecommendedSection from '@/components/RecommendedSection'
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Users, 
  Heart, 
  Check,
  Flame,
  Star,
  ChevronRight,
  Loader2
} from 'lucide-react'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [myEvents, setMyEvents] = useState<any[]>([])
  const [followedEvents, setFollowedEvents] = useState<any[]>([])
  const [hotEvents, setHotEvents] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Fetch upcoming events (for everyone)
    const { data: upcoming } = await supabase
      .from('events_with_counts')
      .select(`
        *,
        promotions (id, name, slug, logo_url)
      `)
      .gte('event_date', today)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(20)

    if (upcoming) {
      const mapped = upcoming.map((e: any) => ({
        ...e,
        attending_count: e.real_attending_count || 0,
        interested_count: e.real_interested_count || 0
      }))
      setUpcomingEvents(mapped)
      
      // Hot events = sorted by attendance
      const hot = [...mapped].sort((a, b) => 
        (b.attending_count + b.interested_count) - (a.attending_count + a.interested_count)
      ).filter(e => e.attending_count + e.interested_count > 0).slice(0, 4)
      setHotEvents(hot)
    }

    // Fetch promotions
    const { data: promos } = await supabase
      .from('promotions')
      .select('id, name, slug')
      .order('name')
      .limit(12)
    
    if (promos) setPromotions(promos)

    // Personalized data for logged-in users
    if (user) {
      // Events I'm attending
      const { data: attending } = await supabase
        .from('user_event_attendance')
        .select(`
          status,
          event_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (attending && attending.length > 0) {
        // Get the event IDs
        const eventIds = attending.map((a: any) => a.event_id)
        
        // Fetch full event data with real counts
        const { data: eventData } = await supabase
          .from('events_with_counts')
          .select(`
            *,
            promotions (id, name, slug, logo_url)
          `)
          .in('id', eventIds)
        
        if (eventData) {
          // Create a map of attendance status by event ID
          const statusMap = new Map(attending.map((a: any) => [a.event_id, a.status]))
          
          const myEventsList = eventData
            .filter((e: any) => new Date(e.event_date) >= new Date())
            .map((e: any) => ({
              ...e,
              attendance_status: statusMap.get(e.id),
              attending_count: e.real_attending_count || 0,
              interested_count: e.real_interested_count || 0
            }))
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
          
          setMyEvents(myEventsList)
        }
      }

      // Events from followed wrestlers/promotions
      const { data: followedWrestlers } = await supabase
        .from('user_follows_wrestler')
        .select('wrestler_id')
        .eq('user_id', user.id)

      const { data: followedPromos } = await supabase
        .from('user_follows_promotion')
        .select('promotion_id')
        .eq('user_id', user.id)

      let allFollowedEvents: any[] = []

      if (followedPromos && followedPromos.length > 0) {
        const promoIds = followedPromos.map((f: any) => f.promotion_id)
        
        const { data: promoEvents } = await supabase
          .from('events_with_counts')
          .select(`
            *,
            promotions (id, name, slug, logo_url)
          `)
          .in('promotion_id', promoIds)
          .gte('event_date', today)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true })
          .limit(8)

        if (promoEvents) {
          const mapped = promoEvents.map((e: any) => ({
            ...e,
            attending_count: e.real_attending_count || 0,
            interested_count: e.real_interested_count || 0
          }))
          allFollowedEvents = mapped
        }
      }

      if (followedWrestlers && followedWrestlers.length > 0) {
        const wrestlerIds = followedWrestlers.map((f: any) => f.wrestler_id)
        
        // Check event_wrestlers
        const { data: ewLinks } = await supabase
          .from('event_wrestlers')
          .select('event_id')
          .in('wrestler_id', wrestlerIds)

        // Check match_participants
        const { data: mpLinks } = await supabase
          .from('match_participants')
          .select('event_matches(event_id)')
          .in('wrestler_id', wrestlerIds)

        // Check event_announced_talent
        const { data: atLinks } = await supabase
          .from('event_announced_talent')
          .select('event_id')
          .in('wrestler_id', wrestlerIds)

        // Collect all event IDs
        const eventIdSet = new Set<string>()
        for (const l of (ewLinks || [])) eventIdSet.add(l.event_id)
        for (const l of (mpLinks || [])) {
          const eventId = (l as any).event_matches?.event_id
          if (eventId) eventIdSet.add(eventId)
        }
        for (const l of (atLinks || [])) eventIdSet.add((l as any).event_id)

        const eventIds = Array.from(eventIdSet)

        if (eventIds.length > 0) {
          
          const { data: wrestlerEvents } = await supabase
            .from('events_with_counts')
            .select(`
              *,
              promotions (id, name, slug, logo_url)
            `)
            .in('id', eventIds)
            .gte('event_date', today)
            .eq('status', 'upcoming')
            .order('event_date', { ascending: true })
            .limit(8)

          if (wrestlerEvents) {
            const mapped = wrestlerEvents.map((e: any) => ({
              ...e,
              attending_count: e.real_attending_count || 0,
              interested_count: e.real_interested_count || 0
            }))
            // Merge with followed promo events, dedupe
            const existingIds = new Set<string>()
            allFollowedEvents.forEach(e => existingIds.add(e.id))
            mapped.forEach((e: any) => {
              if (!existingIds.has(e.id)) {
                allFollowedEvents.push(e)
                existingIds.add(e.id)
              }
            })
          }
        }
      }

      // Sort by date and limit
      allFollowedEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      setFollowedEvents(allFollowedEvents.slice(0, 8))
    }

    setLoading(false)
  }

  const hasPersonalizedContent = user && (myEvents.length > 0 || followedEvents.length > 0)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background-secondary to-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              Never miss another{' '}
              <span className="text-accent">indie show</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground-muted mb-8">
              Discover wrestling events across the United States. Follow your favorite wrestlers. 
              Connect with the indie wrestling community.
            </p>
            
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/map" className="btn btn-primary">
                <MapPin className="w-4 h-4 mr-2" />
                Find Events Near Me
              </Link>
              <Link href="/events" className="btn btn-secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Browse All Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Section for Logged-in Users */}
      {!authLoading && user && (
        <>
          {/* My Events */}
          {myEvents.length > 0 && (
            <section className="py-10 bg-gradient-to-r from-green-500/5 to-accent/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                    <Check className="w-6 h-6 text-green-500" />
                    My Events
                  </h2>
                  <Link href="/profile" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {myEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard event={event} />
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        event.attendance_status === 'attending' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {event.attendance_status === 'attending' ? 'Going' : 'Interested'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Events From People You Follow */}
          {followedEvents.length > 0 && (
            <section className="py-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-500" />
                    From Your Follows
                  </h2>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {followedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Prompt to follow if no personalized content */}
          {!hasPersonalizedContent && !loading && (
            <section className="py-10 bg-background-secondary">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="card p-8 text-center max-w-2xl mx-auto">
                  <Star className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold mb-2">Personalize Your Feed</h3>
                  <p className="text-foreground-muted mb-6">
                    Follow wrestlers and promotions to see their upcoming events here. 
                    Mark events as "Going" or "Interested" to keep track of your schedule.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Link href="/wrestlers" className="btn btn-secondary">
                      <Users className="w-4 h-4 mr-2" />
                      Browse Wrestlers
                    </Link>
                    <Link href="/promotions" className="btn btn-secondary">
                      Browse Promotions
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Near You - geolocation based */}
      <NearYouSection />

      {/* This Weekend / This Week */}
      <ThisWeekendSection />

      {/* Recommended For You - logged in only */}
      {!authLoading && user && <RecommendedSection />}

      {/* Hot Events */}
      {hotEvents.length > 0 && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Hot Events
              </h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hotEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Coming Up */}
      <section className="py-10 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-accent" />
              Coming Up
            </h2>
            <Link href="/events" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingEvents.slice(0, 12).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotions */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Promotions</h2>
            <Link href="/promotions" className="text-accent hover:text-accent-hover font-medium text-sm flex items-center">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {promotions.map((promo) => (
              <Link
                key={promo.id}
                href={`/promotions/${promo.slug}`}
                className="px-4 py-2 rounded-full bg-background-tertiary text-foreground-muted hover:text-foreground hover:bg-border transition-colors text-sm font-medium"
              >
                {promo.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-accent/10 to-accent-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Join the HotTag Community
            </h2>
            <p className="text-foreground-muted mb-8 max-w-2xl mx-auto">
              Create an account to follow wrestlers, track events you're attending, 
              and get a personalized feed of upcoming shows.
            </p>
            <Link href="/signup" className="btn btn-primary">
              Sign Up Free
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
