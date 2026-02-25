'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PosterEventCard, { PosterEventCardSkeleton } from '@/components/PosterEventCard'

interface EventCarouselProps {
  events: any[]
  loading?: boolean
  skeletonCount?: number
  badge?: (event: any) => React.ReactNode
}

export default function EventCarousel({ events, loading, skeletonCount = 6, badge }: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number>(0)

  // Stable ref — prevents listener re-attachment on every render
  const checkScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const left = el.scrollLeft > 4
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      setCanScrollLeft(prev => prev !== left ? left : prev)
      setCanScrollRight(prev => prev !== right ? right : prev)
    })
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [events, loading, checkScroll])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.clientWidth || 250
    const distance = cardWidth * 3
    el.scrollBy({ left: dir === 'left' ? -distance : distance, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[240px] sm:w-[270px] lg:w-[300px]">
              <PosterEventCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { scroll('left'); e.preventDefault() }
    if (e.key === 'ArrowRight') { scroll('right'); e.preventDefault() }
  }

  return (
    <div className="relative group/carousel" role="region" aria-label="Event carousel">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 -translate-x-1/2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 translate-x-1/2"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ willChange: 'scroll-position' }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="list"
        aria-label="Events"
      >
        {events.map((event) => (
          <div key={event.id} className="flex-shrink-0 w-[240px] sm:w-[270px] lg:w-[300px] relative">
            <PosterEventCard event={event} />
            {badge && badge(event)}
          </div>
        ))}
      </div>

      {/* Edge fades */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
      )}
    </div>
  )
}
