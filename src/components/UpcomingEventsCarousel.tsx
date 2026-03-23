'use client'

import { useState, useRef } from 'react'
import PosterEventCard from './PosterEventCard'

interface UpcomingEventsCarouselProps {
  events: any[]
}

export default function UpcomingEventsCarousel({ events }: UpcomingEventsCarouselProps) {
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display font-bold">
          Upcoming Events ({events.length})
        </h2>
        {events.length >= 6 && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="text-sm text-foreground-muted hover:text-accent transition-colors"
          >
            {showAll ? 'Collapse' : `See All (${events.length})`} ›
          </button>
        )}
      </div>

      {showAll ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <PosterEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory"
        >
          {events.map((event: any) => (
            <div key={event.id} className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px] snap-start">
              <PosterEventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
