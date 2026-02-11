'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { getHeroCSS } from '@/lib/hero-themes'
import { Megaphone, User, ChevronLeft, ChevronRight, Crown } from 'lucide-react'

interface Talent {
  id: string
  announcement_note: string | null
  wrestlers: {
    id: string
    name: string
    slug: string
    photo_url: string | null
    render_url: string | null
    moniker: string | null
    hero_style: any
  }
}

export default function AnnouncedTalentList({ eventId, championMap = {} }: { eventId: string; championMap?: Record<string, string> }) {
  const [talent, setTalent] = useState<Talent[]>([])
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTalent()
  }, [eventId])

  const loadTalent = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_announced_talent')
      .select(`
        id,
        announcement_note,
        wrestlers (id, name, slug, photo_url, render_url, moniker, hero_style)
      `)
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (data && data.length > 0) {
      setTalent(data as unknown as Talent[])
    }
  }

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (talent.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent" />
          Announced Talent ({talent.length})
        </h2>
        <div className="flex items-center gap-2">
          {!showAll && talent.length > 5 && (
            <>
              <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {talent.length > 5 && (
            <button onClick={() => setShowAll(!showAll)} className="text-sm text-accent hover:underline ml-2">
              {showAll ? 'Collapse' : 'View All'}
            </button>
          )}
        </div>
      </div>

      {showAll ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {talent.map(t => (
            <TalentHeroCard key={t.id} talent={t} championMap={championMap} />
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
          {talent.map(t => (
            <div key={t.id} className="flex-shrink-0 w-[140px] sm:w-[160px]">
              <TalentHeroCard talent={t} championMap={championMap} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TalentHeroCard({ talent, championMap }: { talent: Talent; championMap: Record<string, string> }) {
  const w = talent.wrestlers
  const imageUrl = w.render_url || w.photo_url
  const heroCSS = getHeroCSS(w.hero_style || null)
  const hasTheme = !!w.hero_style
  const isChamp = !!championMap[w.id]

  return (
    <Link href={`/wrestlers/${w.slug}`} className="block group">
      <div className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary ${isChamp ? 'ring-2 ring-yellow-500/60' : ''}`}>
        {/* Hero background */}
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
              sizes="160px"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-foreground-muted/30" />
          </div>
        )}
        {/* Champion crown */}
        {isChamp && (
          <div className="absolute top-2 right-2 z-[3]">
            <Crown className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
          </div>
        )}
        {/* Name + moniker + champ title */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 z-[3]">
          {w.moniker && (
            <span className="text-[10px] font-bold italic text-accent/80 line-clamp-1 drop-shadow-lg">
              &ldquo;{w.moniker}&rdquo;
            </span>
          )}
          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
            {w.name}
          </span>
          {isChamp && (
            <span className="text-[10px] font-semibold text-yellow-400 line-clamp-1 drop-shadow-lg">
              {championMap[w.id]}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
