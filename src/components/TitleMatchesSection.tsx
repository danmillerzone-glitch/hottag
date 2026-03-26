'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import TitleMatchCard from './TitleMatchCard'

export default function TitleMatchesSection() {
  const [matches, setMatches] = useState<any[]>([])
  const [championIds, setChampionIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    fetchFeaturedMatches()
  }, [])

  async function fetchFeaturedMatches() {
    const supabase = createClient()
    const today = getTodayHawaii()

    const { data } = await supabase
      .from('event_matches')
      .select(`
        id, championship_name, match_title, match_type, featured_sort_order,
        events!inner (id, name, event_date, poster_url, city, state, venue_name,
          promotions (id, name, slug, logo_url)
        ),
        match_participants (
          id, team_number, entrance_order,
          wrestlers (id, name, slug, photo_url, render_url)
        )
      `)
      .eq('featured_title_match', true)
      .eq('is_title_match', true)
      .gte('events.event_date', today)
      .eq('events.status', 'upcoming')
      .order('featured_sort_order', { ascending: true })

    const matchList = data || []
    setMatches(matchList)

    // Build champion ID set from promotion_championships
    const promoIds = [...new Set(matchList.map((m: any) => m.events?.promotions?.id).filter(Boolean))]
    if (promoIds.length > 0) {
      const { data: championships } = await supabase
        .from('promotion_championships')
        .select('current_champion_id, current_champion_2_id')
        .in('promotion_id', promoIds)
        .eq('is_active', true)

      if (championships) {
        const ids = new Set<string>()
        for (const c of championships) {
          if (c.current_champion_id) ids.add(c.current_champion_id)
          if (c.current_champion_2_id) ids.add(c.current_champion_2_id)
        }
        setChampionIds(ids)
      }
    }

    setLoading(false)
  }

  // Scroll state tracking
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [matches, checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.clientWidth || 500
    const distance = cardWidth + 16 // card width + gap
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' })
  }

  // Hide section if no matches after loading
  if (!loading && matches.length === 0) return null

  return (
    <section className="py-6 sm:py-10 bg-gradient-to-b from-[#ffd700]/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#ffd700]" />
            Upcoming Title Matches
          </h2>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[480px] lg:max-w-[540px]">
                <div className="flex h-[260px] sm:h-[340px] rounded-xl overflow-hidden border border-border border-t-2 border-t-[#ffd700]/30 bg-background-secondary animate-pulse">
                  <div className="w-[45%] bg-background-tertiary" />
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div className="h-5 bg-background-tertiary rounded w-3/4" />
                    <div className="flex-1 flex items-center justify-center gap-4">
                      <div className="w-20 h-20 rounded-lg bg-background-tertiary" />
                      <div className="w-8 h-6 bg-background-tertiary rounded" />
                      <div className="w-20 h-20 rounded-lg bg-background-tertiary" />
                    </div>
                    <div className="h-12 bg-background-tertiary rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="relative group/carousel">
            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
            >
              {matches.map((match) => (
                <TitleMatchCard key={match.id} match={match} championIds={championIds} />
              ))}
            </div>

            {/* Left arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border shadow-lg items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border shadow-lg items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
