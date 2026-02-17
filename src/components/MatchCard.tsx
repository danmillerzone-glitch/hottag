'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { getHeroCSS } from '@/lib/hero-themes'
import { Swords, Trophy, User, Crown } from 'lucide-react'

interface Match {
  id: string
  match_title: string | null
  match_type: string | null
  match_stipulation: string | null
  match_order: number | null
  is_title_match: boolean
  championship_name: string | null
  match_participants: {
    id: string
    team_number: number
    wrestlers: {
      id: string
      name: string
      slug: string
      photo_url: string | null
      render_url: string | null
      moniker: string | null
      hero_style: any
    }
  }[]
}

function WrestlerHeroCard({ wrestler, championTitle }: { wrestler: any; championTitle?: string }) {
  const imageUrl = wrestler.render_url || wrestler.photo_url
  const heroCSS = getHeroCSS(wrestler.hero_style || null)
  const hasTheme = !!wrestler.hero_style
  const isChamp = !!championTitle

  return (
    <Link href={`/wrestlers/${wrestler.slug}`} className="block group w-[100px] sm:w-[120px]">
      <div className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-background-tertiary ${isChamp ? 'border-2 border-yellow-500/60' : ''}`}>
        {hasTheme && (
          <div className="absolute inset-0 z-[0]">
            {wrestler.hero_style?.type === 'flag' ? (
              <img src={`https://floznswkfodjuigfzkki.supabase.co/storage/v1/object/public/flags/${wrestler.hero_style.value.toLowerCase()}.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
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
              alt={wrestler.name}
              fill
              className={`${wrestler.render_url ? 'object-contain object-bottom' : 'object-cover'} group-hover:scale-105 transition-transform duration-300 relative z-[1]`}
              sizes="120px"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-foreground-muted/30" />
          </div>
        )}
        {isChamp && (
          <div className="absolute top-1.5 right-1.5 z-[3]">
            <Crown className="w-3.5 h-3.5 text-yellow-400 drop-shadow-lg" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 z-[3]">
          <span className="text-xs font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
            {wrestler.name}
          </span>
        </div>
      </div>
      {isChamp && (
        <span className="block text-[10px] font-semibold text-yellow-400 text-center mt-1 line-clamp-1">
          {championTitle}
        </span>
      )}
    </Link>
  )
}

export default function MatchCard({ eventId, championMap = {} }: { eventId: string; championMap?: Record<string, string> }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatches()
  }, [eventId])

  const loadMatches = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('event_matches')
      .select(`
        *,
        match_participants (
          *,
          wrestlers (id, name, slug, photo_url, render_url, moniker, hero_style)
        )
      `)
      .eq('event_id', eventId)
      .order('match_order', { ascending: true, nullsFirst: false })

    if (!error && data && data.length > 0) {
      setMatches(data)
    }
    setLoading(false)
  }

  if (loading || matches.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Swords className="w-5 h-5 text-accent" />
        Match Card
      </h2>
      <div className="space-y-4">
        {matches.map((match, index) => {
          const participants = match.match_participants || []
          const team1 = participants.filter(p => p.team_number === 1)
          const team2 = participants.filter(p => p.team_number === 2)
          const hasTeams = team2.length > 0

          return (
            <div
              key={match.id}
              className="p-5 rounded-xl bg-background-tertiary border border-border"
            >
              {/* Match header */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-bold text-foreground-muted bg-background px-2 py-0.5 rounded">
                  {match.match_order ? `Match ${match.match_order}` : `Match ${index + 1}`}
                </span>
                {match.match_title && (
                  <span className="text-sm font-semibold">{match.match_title}</span>
                )}
                {match.is_title_match && (
                  <span className="badge bg-interested/20 text-interested text-xs">
                    <Trophy className="w-3 h-3 mr-0.5" />
                    {match.championship_name || 'Title Match'}
                  </span>
                )}
                {(match.match_type || match.match_stipulation) && (
                  <span className="text-xs text-foreground-muted">
                    {[match.match_type, match.match_stipulation].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>

              {/* Participants with hero cards */}
              {hasTeams ? (
                <div className="flex items-start justify-center gap-4 sm:gap-8">
                  <div className="flex flex-wrap justify-end gap-3">
                    {team1.map((p) => (
                      <WrestlerHeroCard key={p.id} wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                    ))}
                  </div>
                  
                  <div className="flex-shrink-0 pt-8 sm:pt-10">
                    <span className="text-lg font-bold text-accent">VS</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {team2.map((p) => (
                      <WrestlerHeroCard key={p.id} wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-center gap-3">
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-start gap-3">
                      <WrestlerHeroCard wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                      {i < participants.length - 1 && (
                        <span className="text-sm font-bold text-accent pt-8 sm:pt-10">vs</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
