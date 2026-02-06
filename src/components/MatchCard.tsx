'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
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
    }
  }[]
}

function WrestlerCard({ wrestler, championTitle }: { wrestler: { id: string; name: string; slug: string; photo_url: string | null }; championTitle?: string }) {
  return (
    <Link
      href={`/wrestlers/${wrestler.slug}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 ${championTitle ? 'border-yellow-500' : 'border-border'} group-hover:border-accent transition-colors`}>
        {wrestler.photo_url ? (
          <Image
            src={wrestler.photo_url}
            alt={wrestler.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <User className="w-8 h-8 text-foreground-muted" />
        )}
      </div>
      <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2 max-w-[100px]">
        {wrestler.name}
      </span>
      {championTitle && (
        <span className="flex items-center justify-center gap-0.5 text-xs text-yellow-500 -mt-1 max-w-[100px]" title={championTitle}>
          <Crown className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{championTitle}</span>
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
          wrestlers (id, name, slug, photo_url)
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

              {/* Participants with large images */}
              {hasTeams ? (
                /* Team vs Team layout */
                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  <div className="flex flex-wrap justify-end gap-4">
                    {team1.map((p) => (
                      <WrestlerCard key={p.id} wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                    ))}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <span className="text-lg font-bold text-accent">VS</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {team2.map((p) => (
                      <WrestlerCard key={p.id} wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                    ))}
                  </div>
                </div>
              ) : (
                /* Multi-way / singles layout */
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4">
                      <WrestlerCard wrestler={p.wrestlers} championTitle={championMap[p.wrestlers.id]} />
                      {i < participants.length - 1 && (
                        <span className="text-sm font-bold text-accent">vs</span>
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
