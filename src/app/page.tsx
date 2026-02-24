'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'
import EventCarousel from '@/components/EventCarousel'
import HeroSlideshow from '@/components/HeroSlideshow'
import NearYouSection from '@/components/NearYouSection'
import ThisWeekendSection from '@/components/ThisWeekendSection'
import RecommendedSection from '@/components/RecommendedSection'
import WhatsNewSection from '@/components/WhatsNewSection'
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
  const [heroImages, setHeroImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Fire independent queries in parallel
    const upcomingPromise = supabase
      .from('events')
      .select('*, promotions (id, name, slug, logo_url)')
      .gte('event_date', today)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(20)

    const heroPromise = supabase
      .from('hero_slides')
      .select('id, image_url, title, subtitle, link_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // User-specific queries (fire all at once if logged in)
    const attendingPromise = user
      ? supabase.from('user_event_attendance').select('status, event_id').eq('user_id', user.id).order('created_at', { ascending: false })
      : null

    const followedWrestlersPromise = user
      ? supabase.from('user_follows_wrestler').select('wrestler_id').eq('user_id', user.id)
      : null

    const followedPromosPromise = user
      ? supabase.from('user_follows_promotion').select('promotion_id').eq('user_id', user.id)
      : null

    // Await all initial queries together
    const [upcomingRes, heroRes, attendingRes, fwRes, fpRes] = await Promise.all([
      upcomingPromise,
      heroPromise,
      attendingPromise,
      followedWrestlersPromise,
      followedPromosPromise,
    ])

    // Process hero slides
    if (heroRes.data) setHeroImages(heroRes.data)

    // Process upcoming events
    const upcoming = upcomingRes.data
    if (upcoming) {
      const mapped = upcoming.map((e: any) => ({
        ...e,
        attending_count: e.real_attending_count || e.attending_count || 0,
        interested_count: e.real_interested_count || e.interested_count || 0
      }))
      setUpcomingEvents(mapped)
      
      const hot = [...mapped].sort((a, b) => 
        (b.attending_count + b.interested_count) - (a.attending_count + a.interested_count)
      ).filter(e => e.attending_count + e.interested_count > 0).slice(0, 4)
      setHotEvents(hot)
    }

    // Process personalized data
    if (user) {
      const attending = attendingRes?.data
      const followedWrestlers = fwRes?.data
      const followedPromos = fpRes?.data

      // Second wave of parallel queries based on first results
      const secondWave: Promise<any>[] = []

      // My events
      let myEventsPromise: Promise<any> | null = null
      if (attending && attending.length > 0) {
        const eventIds = attending.map((a: any) => a.event_id)
        myEventsPromise = Promise.resolve(supabase
          .from('events')
          .select('*, promotions (id, name, slug, logo_url)')
          .in('id', eventIds))
        secondWave.push(myEventsPromise)
      }

      // Followed promo events
      let promoEventsPromise: Promise<any> | null = null
      if (followedPromos && followedPromos.length > 0) {
        const promoIds = followedPromos.map((f: any) => f.promotion_id)
        promoEventsPromise = Promise.resolve(supabase
          .from('events')
          .select('*, promotions (id, name, slug, logo_url)')
          .in('promotion_id', promoIds)
          .gte('event_date', today)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true })
          .limit(8))
        secondWave.push(promoEventsPromise)
      }

      // Followed wrestler event links (3 tables in parallel)
      let wrestlerLinksPromise: Promise<[any, any, any]> | null = null
      if (followedWrestlers && followedWrestlers.length > 0) {
        const wrestlerIds = followedWrestlers.map((f: any) => f.wrestler_id)
        wrestlerLinksPromise = Promise.all([
          Promise.resolve(supabase.from('event_wrestlers').select('event_id').in('wrestler_id', wrestlerIds)),
          Promise.resolve(supabase.from('match_participants').select('event_matches(event_id)').in('wrestler_id', wrestlerIds)),
          Promise.resolve(supabase.from('event_announced_talent').select('event_id').in('wrestler_id', wrestlerIds)),
        ])
        secondWave.push(wrestlerLinksPromise)
      }

      await Promise.all(secondWave)

      // Process my events
      if (myEventsPromise && attending) {
        const { data: eventData } = await myEventsPromise
        if (eventData) {
          const statusMap = new Map(attending.map((a: any) => [a.event_id, a.status]))
          const myEventsList = eventData
            .filter((e: any) => new Date(e.event_date) >= new Date())
            .map((e: any) => ({
              ...e,
              attendance_status: statusMap.get(e.id),
              attending_count: e.real_attending_count || e.attending_count || 0,
              interested_count: e.real_interested_count || e.interested_count || 0
            }))
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
          setMyEvents(myEventsList)
        }
      }

      // Process followed events
      let allFollowedEvents: any[] = []

      if (promoEventsPromise) {
        const { data: promoEvents } = await promoEventsPromise
        if (promoEvents) {
          allFollowedEvents = promoEvents.map((e: any) => ({
            ...e,
            attending_count: e.real_attending_count || e.attending_count || 0,
            interested_count: e.real_interested_count || e.interested_count || 0
          }))
        }
      }

      if (wrestlerLinksPromise) {
        const [ewRes, mpRes, atRes] = await wrestlerLinksPromise
        const eventIdSet = new Set<string>()
        for (const l of (ewRes.data || [])) eventIdSet.add(l.event_id)
        for (const l of (mpRes.data || [])) {
          const eventId = (l as any).event_matches?.event_id
          if (eventId) eventIdSet.add(eventId)
        }
        for (const l of (atRes.data || [])) eventIdSet.add((l as any).event_id)

        const eventIds = Array.from(eventIdSet)
        if (eventIds.length > 0) {
          const { data: wrestlerEvents } = await supabase
            .from('events')
            .select('*, promotions (id, name, slug, logo_url)')
            .in('id', eventIds)
            .gte('event_date', today)
            .eq('status', 'upcoming')
            .order('event_date', { ascending: true })
            .limit(8)

          if (wrestlerEvents) {
            const existingIds = new Set(allFollowedEvents.map(e => e.id))
            for (const e of wrestlerEvents) {
              if (!existingIds.has(e.id)) {
                allFollowedEvents.push({
                  ...e,
                  attending_count: (e as any).real_attending_count || (e as any).attending_count || 0,
                  interested_count: (e as any).real_interested_count || (e as any).interested_count || 0
                })
              }
            }
          }
        }
      }

      allFollowedEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      setFollowedEvents(allFollowedEvents.slice(0, 8))
    }

    setLoading(false)
  }

  const hasPersonalizedContent = user && (myEvents.length > 0 || followedEvents.length > 0)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSlideshow images={heroImages} />

      {/* What's New — news feed for all visitors */}
      <WhatsNewSection />

      {/* Personalized Section for Logged-in Users */}
      {!authLoading && user && (
        <>
          {/* My Events */}
          {myEvents.length > 0 && (
            <section className="py-10 bg-gradient-to-t from-green-500/5 to-transparent">
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
                
                <EventCarousel
                  events={myEvents.slice(0, 10)}
                  badge={(event) => (
                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold z-10 ${
                      event.attendance_status === 'attending'
                        ? 'bg-green-500/90 text-white'
                        : 'bg-pink-500/90 text-white'
                    }`}>
                      {event.attendance_status === 'attending' ? 'GOING' : 'INTERESTED'}
                    </span>
                  )}
                />
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
                
                <EventCarousel events={followedEvents} />
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
            
            <EventCarousel events={hotEvents} />
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
            <EventCarousel events={[]} loading={true} skeletonCount={8} />
          ) : (
            <EventCarousel events={upcomingEvents.slice(0, 20)} />
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-accent/10 to-accent-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Join the Hot Tag Community
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
