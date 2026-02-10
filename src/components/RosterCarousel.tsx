'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, User, Users } from 'lucide-react'
import { getHeroCSS, type HeroStyle } from '@/lib/hero-themes'

interface RosterMember {
  id: string
  wrestlers: {
    id: string
    name: string
    slug: string
    photo_url: string | null
    render_url: string | null
    hometown: string | null
    moniker: string | null
    hero_style: HeroStyle | null
  }
}

export default function RosterCarousel({ roster }: { roster: RosterMember[] }) {
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sorted = [...roster].sort((a, b) => (a.wrestlers?.name || '').localeCompare(b.wrestlers?.name || ''))

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" />
          Roster ({roster.length})
        </h2>
        <div className="flex items-center gap-2">
          {!showAll && roster.length > 6 && (
            <>
              <button onClick={() => scroll('left')} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll('right')} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          {roster.length > 6 && (
            <button onClick={() => setShowAll(!showAll)} className="text-sm text-accent hover:underline ml-2">
              {showAll ? 'Collapse' : 'View All'}
            </button>
          )}
        </div>
      </div>

      {showAll ? (
        /* Full grid view */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {sorted.map((member) => (
            <RosterCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        /* Carousel view */
        <div className="relative">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
            {sorted.map((member) => (
              <div key={member.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
                <RosterCard member={member} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RosterCard({ member }: { member: RosterMember }) {
  const w = member.wrestlers
  const imageUrl = w.render_url || w.photo_url
  const heroCSS = getHeroCSS(w.hero_style || null)
  const hasTheme = !!w.hero_style

  return (
    <Link href={`/wrestlers/${w.slug}`} className="block group">
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary">
        {/* Custom hero background */}
        {hasTheme && (
          <div className="absolute inset-0 z-[0]">
            {w.hero_style?.type === 'flag' ? (
              <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${w.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
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
              alt={w.name}
              fill
              className={`${w.render_url ? 'object-contain object-bottom' : 'object-cover'} group-hover:scale-105 transition-transform duration-300 relative z-[1]`}
              unoptimized
            />
            {/* Bottom gradient for name readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-foreground-muted/30" />
          </div>
        )}
        {/* Name + moniker overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
          {w.moniker && (
            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
              &ldquo;{w.moniker}&rdquo;
            </span>
          )}
          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
            {w.name}
          </span>
        </div>
      </div>
    </Link>
  )
}
