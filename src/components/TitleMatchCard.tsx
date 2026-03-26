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
    name: string
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

  // Group by team_number for tag team display
  const teamMap = new Map<number, Wrestler[]>()
  for (const p of sorted) {
    const team = p.team_number ?? 1
    if (!teamMap.has(team)) teamMap.set(team, [])
    teamMap.get(team)!.push(p.wrestlers)
  }
  const teams = Array.from(teamMap.values())
  const isTagMatch = teams.length >= 2 && teams.some(t => t.length > 1)
  const isSingleWrestler = participants.length === 1

  // Date formatting
  const date = new Date(event.event_date + 'T12:00:00')
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()

  return (
    <div className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[480px] lg:max-w-[540px] snap-start">
      <div className="flex h-[260px] sm:h-[340px] rounded-xl overflow-hidden border border-border border-t-2 border-t-[#ffd700] bg-background-secondary">
        {/* Left half — Event Poster */}
        <Link href={`/events/${event.id}`} className="relative w-[45%] flex-shrink-0">
          {event.poster_url ? (
            <Image
              src={event.poster_url}
              alt={event.name}
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
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 min-w-0">
          {/* Championship name */}
          <div className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-[#ffd700] flex-shrink-0 mt-0.5" />
            <span className="text-[#ffd700] font-display font-bold text-sm sm:text-base leading-tight line-clamp-2">
              {match.championship_name || 'Title Match'}
            </span>
          </div>

          {/* Wrestlers VS */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
            {isSingleWrestler ? (
              <WrestlerThumb wrestler={sorted[0]?.wrestlers} />
            ) : isTagMatch ? (
              /* Tag team: show teams side by side */
              <>
                <TeamStack wrestlers={teams[0]} />
                <span className="text-white font-display font-bold text-base sm:text-lg flex-shrink-0">VS</span>
                <TeamStack wrestlers={teams[1] || []} />
                {teams.length > 2 && (
                  <span className="text-foreground-muted text-xs">+{teams.length - 2} more</span>
                )}
              </>
            ) : (
              /* Singles: two wrestlers with VS */
              <>
                {sorted[0]?.wrestlers ? (
                  <WrestlerThumb wrestler={sorted[0].wrestlers} />
                ) : (
                  <TBDThumb />
                )}
                <span className="text-white font-display font-bold text-lg sm:text-xl flex-shrink-0">VS</span>
                {participants.length === 0 ? (
                  <TBDThumb />
                ) : sorted[1]?.wrestlers ? (
                  <WrestlerThumb wrestler={sorted[1].wrestlers} />
                ) : (
                  <TBDThumb label="TBA" />
                )}
              </>
            )}
          </div>

          {/* Extra participants for singles (triple threat, etc.) */}
          {!isTagMatch && !isSingleWrestler && sorted.length > 2 && (
            <p className="text-center text-foreground-muted text-xs -mt-1">+{sorted.length - 2} more</p>
          )}

          {/* Event info */}
          <div className="border-t border-border pt-3 mt-auto min-w-0">
            <Link href={`/events/${event.id}`} className="block group">
              <p className="font-bold text-sm text-white truncate group-hover:text-accent transition-colors">
                {event.name}
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

function TeamStack({ wrestlers }: { wrestlers: Wrestler[] }) {
  if (wrestlers.length === 0) return <TBDThumb />
  return (
    <div className="flex flex-col items-center gap-1">
      {wrestlers.map((w) => (
        <WrestlerThumb key={w.id} wrestler={w} compact />
      ))}
    </div>
  )
}

function WrestlerThumb({ wrestler, compact }: { wrestler: Wrestler; compact?: boolean }) {
  const imgSrc = wrestler.render_url || wrestler.photo_url
  const sizeClass = compact
    ? 'w-9 h-9 sm:w-12 sm:h-12'
    : 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20'
  return (
    <Link href={`/wrestlers/${wrestler.slug}`} className="flex flex-col items-center gap-1 min-w-0 group">
      <div className={`${sizeClass} rounded-lg overflow-hidden bg-background-tertiary border border-border flex-shrink-0`}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={wrestler.name}
            width={compact ? 48 : 80}
            height={compact ? 48 : 80}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-foreground-muted font-bold ${compact ? 'text-xs' : 'text-lg'}`}>
            {wrestler.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
      <span className={`text-white text-center leading-tight line-clamp-1 group-hover:text-accent transition-colors ${compact ? 'text-[10px] max-w-[56px]' : 'text-xs max-w-[80px] line-clamp-2'}`}>
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
