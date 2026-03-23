'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PosterEventCard from './PosterEventCard'

interface PastEventsContentProps {
  events: any[]
  entityName: string
  entitySlug: string
  entityType: 'promotions' | 'wrestlers' | 'crew'
  entityImageUrl: string | null
}

function groupByYear(events: any[]): Record<number, any[]> {
  return events.reduce((acc: Record<number, any[]>, event: any) => {
    const year = new Date(event.event_date + 'T12:00:00').getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(event)
    return acc
  }, {})
}

function YearCarousel({ events, year, isExpanded, onToggle }: {
  events: any[]
  year: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-accent">{year}</h2>
        {events.length >= 6 && (
          <button
            onClick={onToggle}
            className="text-sm text-foreground-muted hover:text-accent transition-colors"
          >
            {isExpanded ? 'Collapse' : `See All (${events.length})`} ›
          </button>
        )}
      </div>

      {isExpanded ? (
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

export default function PastEventsContent({
  events,
  entityName,
  entitySlug,
  entityType,
  entityImageUrl,
}: PastEventsContentProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const grouped = groupByYear(events)
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  const backPath = entityType === 'promotions'
    ? `/promotions/${entitySlug}`
    : entityType === 'wrestlers'
    ? `/wrestlers/${entitySlug}`
    : `/crew/${entitySlug}`

  const handleToggle = useCallback((year: number) => {
    setExpandedYear(prev => prev === year ? null : year)
  }, [])

  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href={backPath} className="text-sm text-accent hover:underline">
          ← {entityName}
        </Link>
        <h1 className="text-2xl font-display font-bold mt-2">Past Events</h1>
        <p className="text-foreground-muted mt-4">No past events found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {entityImageUrl && (
          <Image
            src={entityImageUrl}
            alt={entityName}
            width={48}
            height={48}
            className="rounded-xl object-contain"
          />
        )}
        <div>
          <Link href={backPath} className="text-sm text-accent hover:underline">
            ← {entityName}
          </Link>
          <h1 className="text-2xl font-display font-bold">Past Events</h1>
          <p className="text-sm text-foreground-muted">{events.length} events</p>
        </div>
      </div>

      {/* Year groups */}
      {years.map(year => (
        <YearCarousel
          key={year}
          events={grouped[year]}
          year={year}
          isExpanded={expandedYear === year}
          onToggle={() => handleToggle(year)}
        />
      ))}
    </div>
  )
}
