'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users, Ticket, ExternalLink } from 'lucide-react'
import { cn, formatEventDate, formatLocation, formatAttendance, formatPrice } from '@/lib/utils'
import type { EventWithPromotion } from '@/lib/supabase'

interface EventCardProps {
  event: EventWithPromotion
  variant?: 'default' | 'compact' | 'featured'
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const promotion = event.promotions
  
  if (variant === 'compact') {
    return (
      <Link href={`/events/${event.id}`} className="event-card block p-4">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-14 text-center">
            <div className="text-accent font-bold text-lg">
              {formatEventDate(event.event_date)}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-foreground-muted">
              {promotion && (
                <span className="badge badge-promotion">{promotion.name}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatLocation(event.city, event.state)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={`/events/${event.id}`} className="event-card block overflow-hidden group">
        {/* Poster/Banner */}
        <div className="relative aspect-[2/1] bg-background-tertiary">
          {event.poster_url ? (
            <Image
              src={event.poster_url}
              alt={event.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/20 to-background-tertiary">
              {promotion?.logo_url ? (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={120}
                  height={60}
                  className="opacity-50"
                />
              ) : (
                <span className="text-4xl font-display font-bold text-foreground/20">
                  {promotion?.name || 'Event'}
                </span>
              )}
            </div>
          )}
          
          {/* Featured badge */}
          {event.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="badge bg-accent text-white">Featured</span>
            </div>
          )}
          
          {/* Date badge */}
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg">
            <span className="text-accent font-bold">{formatEventDate(event.event_date)}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {promotion && (
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-promotion">{promotion.name}</span>
            </div>
          )}
          
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
            {event.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {event.venue_name || formatLocation(event.city, event.state)}
            </span>
            
            {(event.attending_count > 0 || event.interested_count > 0) && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {formatAttendance(event.attending_count, event.interested_count)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/events/${event.id}`} className="event-card block overflow-hidden group">
      {/* Header with promotion logo */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {promotion && (
              <span className="badge badge-promotion mb-2">{promotion.name}</span>
            )}
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
              {event.name}
            </h3>
          </div>
          
          {/* Date badge */}
          <div className="flex-shrink-0 text-right">
            <div className="text-accent font-bold">{formatEventDate(event.event_date)}</div>
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div className="p-4 pt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {event.venue_name ? `${event.venue_name}, ` : ''}
            {formatLocation(event.city, event.state)}
          </span>
        </div>
        
        {/* Bottom row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-sm text-foreground-muted">
            <Users className="w-4 h-4" />
            <span>{event.attending_count + event.interested_count || 0}</span>
          </div>
          
          {event.ticket_url && (
            <span className="flex items-center gap-1 text-sm text-accent">
              <Ticket className="w-4 h-4" />
              {formatPrice(event.ticket_price_min, event.ticket_price_max, event.is_free)}
            </span>
          )}
          
          {event.is_sold_out && (
            <span className="badge bg-red-500/20 text-red-400">Sold Out</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Loading skeleton
export function EventCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <div className="card p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-8 skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 skeleton" />
            <div className="h-4 w-1/2 skeleton" />
          </div>
        </div>
      </div>
    )
  }
  
  if (variant === 'featured') {
    return (
      <div className="card overflow-hidden">
        <div className="aspect-[2/1] skeleton" />
        <div className="p-5 space-y-3">
          <div className="h-5 w-20 skeleton rounded-full" />
          <div className="h-6 w-3/4 skeleton" />
          <div className="h-4 w-1/2 skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-5 w-20 skeleton rounded-full" />
            <div className="h-5 w-48 skeleton" />
          </div>
          <div className="h-5 w-16 skeleton" />
        </div>
        <div className="h-4 w-40 skeleton" />
        <div className="flex justify-between pt-2 border-t border-border">
          <div className="h-4 w-12 skeleton" />
          <div className="h-4 w-16 skeleton" />
        </div>
      </div>
    </div>
  )
}
