'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'

interface Wrestler {
  id: string
  name: string
  slug: string
  photo_url: string | null
  render_url: string | null
}

interface TitleMatchData {
  id: string
  championship_name: string | null
  match_title: string | null
  match_type: string | null
  events: {
    id: string
    title: string
    event_date: string
    poster_url: string | null
    city: string | null
    state: string | null
    venue_name: string | null
    promotions: {
      id: string
      name: string
      slug: string
      logo_url: string | null
    }
  }
  match_participants: {
    id: string
    team_number: number
    entrance_order: number | null
    wrestlers: Wrestler
  }[]
}

export default function TitleMatchCard({ match }: { match: TitleMatchData }) {
  const event = match.events
  const promotion = event.promotions
  const participants = match.match_participants || []

  // Sort by entrance_order (if set), then by id as fallback
  const sorted = [...participants].sort((a, b) =>
    (a.entrance_order ?? Infinity) - (b.entrance_order ?? Infinity) || a.id.localeCompare(b.id)
  )
  const wrestler1 = sorted[0]?.wrestlers
  const wrestler2 = sorted[1]?.wrestlers
  const extraCount = Math.max(0, sorted.length - 2)
  const isSingleWrestler = participants.length === 1

  // Date formatting
  const date = new Date(event.event_date + 'T12:00:00')
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()

  return (
    <div className="flex-shrink-0 w-[440px] sm:w-[500px] lg:w-[540px] snap-start">
      <div className="flex h-[320px] sm:h-[360px] rounded-xl overflow-hidden border border-border border-t-2 border-t-[#ffd700] bg-background-secondary">
        {/* Left half — Event Poster */}
        <Link href={`/events/${event.id}`} className="relative w-[45%] flex-shrink-0">
          {event.poster_url ? (
            <Image
              src={event.poster_url}
              alt={event.title}
              fill
              className="object-cover object-top"
              sizes="240px"
            />
          ) : promotion.logo_url ? (
            <div className="w-full h-full flex items-center justify-center bg-background-tertiary p-6">
              <Image
                src={promotion.logo_url}
                alt={promotion.name}
                width={160}
                height={160}
                className="object-contain opacity-40"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-background-tertiary" />
          )}
          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center min-w-[48px]">
            <div className="text-accent text-[10px] font-bold tracking-wider leading-none">{month}</div>
            <div className="text-white text-lg font-bold leading-tight">{day}</div>
          </div>
        </Link>

        {/* Right half — Match Details */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 min-w-0">
          {/* Championship name */}
          <div className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-[#ffd700] flex-shrink-0 mt-0.5" />
            <span className="text-[#ffd700] font-display font-bold text-sm sm:text-base leading-tight line-clamp-2">
              {match.championship_name || 'Title Match'}
            </span>
          </div>

          {/* Wrestlers VS */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
            {isSingleWrestler ? (
              /* Single wrestler — centered, no VS (spec: champion with no challenger yet) */
              <WrestlerThumb wrestler={wrestler1!} />
            ) : (
              <>
                {wrestler1 ? (
                  <WrestlerThumb wrestler={wrestler1} />
                ) : (
                  <TBDThumb />
                )}

                <span className="text-white font-display font-bold text-lg sm:text-xl flex-shrink-0">VS</span>

                {participants.length === 0 ? (
                  <TBDThumb />
                ) : wrestler2 ? (
                  <WrestlerThumb wrestler={wrestler2} />
                ) : (
                  <TBDThumb label="TBA" />
                )}
              </>
            )}
          </div>

          {extraCount > 0 && (
            <p className="text-center text-foreground-muted text-xs -mt-1">+{extraCount} more</p>
          )}

          {/* Event info */}
          <div className="border-t border-border pt-3 mt-auto min-w-0">
            <Link href={`/events/${event.id}`} className="block group">
              <p className="font-bold text-sm text-white truncate group-hover:text-accent transition-colors">
                {event.title}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-foreground-muted mt-1">
                {promotion.logo_url && (
                  <Image
                    src={promotion.logo_url}
                    alt={promotion.name}
                    width={16}
                    height={16}
                    className="rounded-sm object-contain"
                  />
                )}
                <span className="truncate">
                  {promotion.name}
                  {event.city && event.state ? ` · ${event.city}, ${event.state}` : ''}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function WrestlerThumb({ wrestler }: { wrestler: Wrestler }) {
  const imgSrc = wrestler.render_url || wrestler.photo_url
  return (
    <Link href={`/wrestlers/${wrestler.slug}`} className="flex flex-col items-center gap-1.5 min-w-0 group">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-background-tertiary border border-border flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={wrestler.name}
            width={80}
            height={80}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground-muted font-bold text-lg">
            {wrestler.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
      <span className="text-white text-xs text-center leading-tight line-clamp-2 group-hover:text-accent transition-colors max-w-[80px]">
        {wrestler.name}
      </span>
    </Link>
  )
}

function TBDThumb({ label = 'TBD' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-background-tertiary border border-border flex items-center justify-center">
        <span className="text-foreground-muted font-bold text-sm">{label}</span>
      </div>
      <span className="text-foreground-muted text-xs">{label}</span>
    </div>
  )
}
