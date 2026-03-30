'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Swords, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'

interface Opponent {
  id: string
  name: string
  slug: string
  photo_url: string | null
  render_url: string | null
  moniker: string | null
  hero_style: HeroStyle | null
}

interface OpponentGroup {
  matchTitle: string | null
  matchType: string | null
  eventName: string
  eventSlug: string
  opponents: Opponent[]
}

export default function UpcomingOpponentsCarousel({ groups }: { groups: OpponentGroup[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalOpponents = groups.reduce((sum, g) => sum + g.opponents.length, 0)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Swords className="w-6 h-6 text-accent" />
          Upcoming Opponents ({totalOpponents})
        </h2>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scroll('left')} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory">
        {groups.map((group, gi) => (
          <div key={gi} className="flex-shrink-0 snap-start">
            {/* Overlapping card stack */}
            <div className="flex">
              {group.opponents.map((opponent, oi) => (
                <div
                  key={opponent.id}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
                  style={{
                    marginLeft: oi > 0 ? '-20px' : undefined,
                    zIndex: oi + 1,
                  }}
                >
                  <OpponentCard opponent={opponent} overlapping={group.opponents.length > 1} />
                </div>
              ))}
            </div>
            {/* Match label — constrained to first card's width to prevent overflow */}
            <Link href={`/events/${group.eventSlug}`} className="block mt-2 w-[140px] sm:w-[160px] md:w-[180px] group/label">
              <p className="text-xs font-semibold text-accent group-hover/label:underline leading-tight">
                {group.matchTitle || group.matchType || 'Match'}
              </p>
              <p className="text-[11px] text-foreground-muted truncate">
                {group.eventName}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpponentCard({ opponent, overlapping }: { opponent: Opponent; overlapping: boolean }) {
  const imageUrl = opponent.render_url || opponent.photo_url
  const heroCSS = getHeroCSS(opponent.hero_style || null)
  const hasTheme = !!opponent.hero_style

  return (
    <Link href={`/wrestlers/${opponent.slug}`} className="block group">
      <div className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary ${overlapping ? 'ring-2 ring-background' : ''}`}>
        {/* Custom hero background */}
        {hasTheme && (
          <div className="absolute inset-0 z-[0]">
            {opponent.hero_style?.type === 'flag' ? (
              <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${opponent.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : (
              <>
                <div className="absolute inset-0" style={{ background: heroCSS.background, opacity: 0.5 }} />
                {heroCSS.texture && (
                  <div className="absolute inset-0" style={{ background: heroCSS.texture, opacity: 0.3 }} />
                )}
              </>
            )}
          </div>
        )}
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={opponent.name}
              fill
              className={`${opponent.render_url ? 'object-contain object-bottom' : 'object-cover'} group-hover:scale-105 transition-transform duration-300 relative z-[1]`}
              sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 180px"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-foreground-muted/30" />
          </div>
        )}
        {/* Name + moniker overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
          {opponent.moniker && (
            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
              &ldquo;{opponent.moniker}&rdquo;
            </span>
          )}
          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
            {opponent.name}
          </span>
        </div>
      </div>
    </Link>
  )
}
