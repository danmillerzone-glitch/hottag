'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Swords, Trophy, User } from 'lucide-react'

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

export default function MatchCard({ eventId }: { eventId: string }) {
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
      <div className="space-y-3">
        {matches.map((match, index) => {
          const participants = match.match_participants || []
          const team1 = participants.filter(p => p.team_number === 1)
          const team2 = participants.filter(p => p.team_number === 2)
          const hasTeams = team2.length > 0

          return (
            <div
              key={match.id}
              className="p-4 rounded-lg bg-background-tertiary border border-border"
            >
              {/* Match header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-foreground-muted bg-background px-2 py-0.5 rounded">
                  {match.match_order ? `#${match.match_order}` : `Match ${index + 1}`}
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
              </div>

              {/* Match type / stipulation */}
              {(match.match_type || match.match_stipulation) && (
                <div className="text-xs text-foreground-muted mb-3">
                  {[match.match_type, match.match_stipulation].filter(Boolean).join(' · ')}
                </div>
              )}

              {/* Participants */}
              {hasTeams ? (
                <div className="flex items-center gap-4">
                  {/* Team 1 */}
                  <div className="flex-1 flex flex-wrap gap-2 justify-end">
                    {team1.map((p) => (
                      <Link
                        key={p.id}
                        href={`/wrestlers/${p.wrestlers.slug}`}
                        className="flex items-center gap-1.5 hover:text-accent transition-colors"
                      >
                        {p.wrestlers.photo_url ? (
                          <Image
                            src={p.wrestlers.photo_url}
                            alt={p.wrestlers.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                            <User className="w-4 h-4 text-foreground-muted" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{p.wrestlers.name}</span>
                      </Link>
                    ))}
                  </div>
                  
                  <span className="text-xs font-bold text-accent flex-shrink-0">VS</span>
                  
                  {/* Team 2 */}
                  <div className="flex-1 flex flex-wrap gap-2">
                    {team2.map((p) => (
                      <Link
                        key={p.id}
                        href={`/wrestlers/${p.wrestlers.slug}`}
                        className="flex items-center gap-1.5 hover:text-accent transition-colors"
                      >
                        {p.wrestlers.photo_url ? (
                          <Image
                            src={p.wrestlers.photo_url}
                            alt={p.wrestlers.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                            <User className="w-4 h-4 text-foreground-muted" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{p.wrestlers.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {participants.map((p, i) => (
                    <span key={p.id} className="flex items-center gap-1.5">
                      <Link
                        href={`/wrestlers/${p.wrestlers.slug}`}
                        className="flex items-center gap-1.5 hover:text-accent transition-colors"
                      >
                        {p.wrestlers.photo_url ? (
                          <Image
                            src={p.wrestlers.photo_url}
                            alt={p.wrestlers.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                            <User className="w-4 h-4 text-foreground-muted" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{p.wrestlers.name}</span>
                      </Link>
                      {i < participants.length - 1 && (
                        <span className="text-xs text-accent font-bold ml-1">vs</span>
                      )}
                    </span>
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
