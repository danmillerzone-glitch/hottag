'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Ticket } from 'lucide-react'
import { formatEventDate, formatAttendance, formatPrice } from '@/lib/utils'

interface PosterEventCardProps {
  event: any
}

export default function PosterEventCard({ event }: PosterEventCardProps) {
  const promotion = event.promotions
  const hasPoster = !!event.poster_url
  const hasLogo = !!promotion?.logo_url
  const date = new Date(event.event_date + 'T12:00:00')
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary">
        {/* Background: poster or logo */}
        {hasPoster ? (
          <Image
            src={event.poster_url}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : hasLogo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background-tertiary to-background-secondary">
            <Image
              src={promotion.logo_url}
              alt={promotion.name}
              width={140}
              height={140}
              className="object-contain opacity-40"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-background-tertiary to-background-secondary flex items-center justify-center">
            <span className="text-3xl font-display font-bold text-foreground/10 uppercase text-center px-4">
              {event.name}
            </span>
          </div>
        )}

        {/* Date badge — top left */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center min-w-[48px]">
          <div className="text-accent text-[10px] font-bold tracking-wider leading-none">{month}</div>
          <div className="text-white text-lg font-bold leading-tight">{day}</div>
        </div>

        {/* Sold out badge */}
        {event.is_sold_out && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-md bg-red-500/90 text-white text-xs font-bold">SOLD OUT</span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Content overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Promotion logo + name */}
          {promotion && (
            <div className="flex items-center gap-2 mb-2">
              {promotion.logo_url && (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={24}
                  height={24}
                  className="object-contain rounded-sm flex-shrink-0"
                  unoptimized
                />
              )}
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">
                {promotion.name}
              </span>
            </div>
          )}

          {/* Event name */}
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors drop-shadow-lg">
            {event.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {[event.city?.replace(/,\s*$/, ''), event.state].filter(Boolean).join(', ')}
              {event.country && event.country !== 'USA' && ` · ${event.country}`}
            </span>
          </div>

          {/* Attendance / Tickets row */}
          {((event.attending_count > 0 || event.interested_count > 0) || event.ticket_url) && (
            <div className="flex items-center gap-3 mt-2 text-[11px] text-white/60">
              {(event.attending_count > 0 || event.interested_count > 0) && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.attending_count + event.interested_count}
                </span>
              )}
              {event.ticket_url && (
                <span className="flex items-center gap-1 text-accent">
                  <Ticket className="w-3 h-3" />
                  {formatPrice(event.ticket_price_min, event.ticket_price_max, event.is_free)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function PosterEventCardSkeleton() {
  return (
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary animate-pulse">
      <div className="absolute top-3 left-3 w-12 h-10 rounded-lg bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
      </div>
    </div>
  )
}
