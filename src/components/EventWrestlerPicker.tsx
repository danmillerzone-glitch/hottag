'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Search, Check, Plus, User, Loader2 } from 'lucide-react'
import { searchWrestlers, type RosterWrestler } from '@/lib/promoter'

export type EventWrestlerPickerMode = 'announced' | 'match'

export interface MatchTeamMember {
  wrestlerId: string
  team: number
}

export interface EventWrestlerPickerProps {
  rosterWrestlers: RosterWrestler[]
  selectedIds: string[]
  mode: EventWrestlerPickerMode
  matchTeams?: MatchTeamMember[]
  showTeamToggle?: boolean
  onAdd: (wrestlerId: string, team?: number) => void
  onRemove: (wrestlerId: string) => void
  onSwap?: (wrestlerId: string, toTeam: number) => void
  emptyRosterHref?: string
}

const MAX_TEAMS = 4

// Color palette per team. Tailwind needs static class names, so each entry is a
// literal string and we look up by team number.
const TEAM_STYLES: Record<number, {
  btnActive: string
  btnInactive: string
  tile: string
  badge: string
  label: string
}> = {
  1: {
    btnActive: 'bg-blue-500 text-white',
    btnInactive: 'bg-background border border-border text-foreground-muted hover:text-foreground',
    tile: 'bg-blue-500/15 border border-blue-400 text-foreground',
    badge: 'bg-blue-500',
    label: 'Team 1',
  },
  2: {
    btnActive: 'bg-red-500 text-white',
    btnInactive: 'bg-background border border-border text-foreground-muted hover:text-foreground',
    tile: 'bg-red-500/15 border border-red-400 text-foreground',
    badge: 'bg-red-500',
    label: 'Team 2',
  },
  3: {
    btnActive: 'bg-emerald-500 text-white',
    btnInactive: 'bg-background border border-border text-foreground-muted hover:text-foreground',
    tile: 'bg-emerald-500/15 border border-emerald-400 text-foreground',
    badge: 'bg-emerald-500',
    label: 'Team 3',
  },
  4: {
    btnActive: 'bg-purple-500 text-white',
    btnInactive: 'bg-background border border-border text-foreground-muted hover:text-foreground',
    tile: 'bg-purple-500/15 border border-purple-400 text-foreground',
    badge: 'bg-purple-500',
    label: 'Team 4',
  },
}

export default function EventWrestlerPicker({
  rosterWrestlers,
  selectedIds,
  mode,
  matchTeams = [],
  showTeamToggle = false,
  onAdd,
  onRemove,
  onSwap,
  emptyRosterHref,
}: EventWrestlerPickerProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RosterWrestler[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<number>(1)
  // Default visible team count is 2; user can grow it via "+ Team" up to MAX_TEAMS.
  const [extraTeamCount, setExtraTeamCount] = useState<number>(2)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const teamMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of matchTeams) m.set(t.wrestlerId, t.team)
    return m
  }, [matchTeams])

  // Visible team count grows automatically with existing participants AND
  // with the user's "+ Team" clicks. Always at least 2 (a tag match), capped at MAX_TEAMS.
  const teamCount = useMemo(() => {
    const maxInUse = matchTeams.reduce((m, t) => Math.max(m, t.team), 1)
    return Math.min(MAX_TEAMS, Math.max(2, maxInUse, extraTeamCount))
  }, [matchTeams, extraTeamCount])

  // Clamp selectedTeam if teamCount shrinks (e.g. removing the last wrestler from a team)
  useEffect(() => {
    if (selectedTeam > teamCount) setSelectedTeam(teamCount)
  }, [selectedTeam, teamCount])

  // Debounced wrestler search (matches existing 300ms / 2-char threshold)
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchWrestlers(q, 20)
    setSearchResults(results as RosterWrestler[])
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  // "More from Hot Tag" should hide wrestlers already in the roster (they're shown above)
  const rosterIdSet = useMemo(() => new Set(rosterWrestlers.map(w => w.id)), [rosterWrestlers])
  const moreResults = useMemo(
    () => searchResults.filter(w => !rosterIdSet.has(w.id)),
    [searchResults, rosterIdSet]
  )

  // Returns the team number for a tile, or 0 for "added but no team", or null for neutral
  const getTileTeam = (wrestlerId: string): number | 0 | null => {
    if (!selectedSet.has(wrestlerId)) return null
    if (mode === 'announced') return 0
    if (showTeamToggle) {
      const team = teamMap.get(wrestlerId)
      return team ?? 0
    }
    return 0
  }

  const handleTileTap = (wrestlerId: string) => {
    const tileTeam = getTileTeam(wrestlerId)
    if (mode === 'announced') {
      if (tileTeam !== null) onRemove(wrestlerId)
      else onAdd(wrestlerId)
      return
    }
    // match mode
    if (tileTeam === null) {
      onAdd(wrestlerId, showTeamToggle ? selectedTeam : undefined)
      return
    }
    if (showTeamToggle) {
      const currentTeam = teamMap.get(wrestlerId)
      if (currentTeam === selectedTeam) {
        onRemove(wrestlerId)
      } else if (onSwap) {
        onSwap(wrestlerId, selectedTeam)
      }
      return
    }
    // non-team match types — same-tile tap removes
    onRemove(wrestlerId)
  }

  const handleAddTeam = () => {
    setExtraTeamCount(c => Math.min(MAX_TEAMS, Math.max(c, teamCount) + 1))
  }

  const renderTile = (w: RosterWrestler) => {
    const tileTeam = getTileTeam(w.id)
    const teamStyle = tileTeam && tileTeam > 0 ? TEAM_STYLES[tileTeam] : null
    const tileClasses = (() => {
      if (tileTeam === null) return 'bg-background border border-border hover:border-accent/50 text-foreground'
      if (teamStyle) return teamStyle.tile
      return 'bg-accent/15 border border-accent text-foreground'
    })()
    const iconForState = () => {
      if (tileTeam === null) return <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-background-tertiary rounded-full p-0.5 text-foreground-muted" />
      if (teamStyle) {
        return (
          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${teamStyle.badge} text-[9px] font-bold text-white flex items-center justify-center`}>
            {tileTeam}
          </span>
        )
      }
      return <Check className="w-3 h-3 absolute -top-1 -right-1 bg-accent text-background rounded-full p-0.5" />
    }
    return (
      <button
        key={w.id}
        type="button"
        onClick={() => handleTileTap(w.id)}
        className={`relative flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${tileClasses}`}
      >
        <span className="relative shrink-0">
          {w.photo_url ? (
            <Image
              src={w.photo_url}
              alt={w.name}
              width={26}
              height={26}
              className="w-[26px] h-[26px] rounded object-cover object-top"
              unoptimized
            />
          ) : (
            <span className="w-[26px] h-[26px] rounded bg-background-tertiary flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-foreground-muted" />
            </span>
          )}
          {iconForState()}
        </span>
        <span className="truncate flex-1 min-w-0">{w.name}</span>
      </button>
    )
  }

  return (
    <div className="rounded-lg bg-background-tertiary border border-border p-3 space-y-3">
      {/* Team toggle (match mode + tag-style only) */}
      {mode === 'match' && showTeamToggle && (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-foreground-muted">NEXT TAP →</span>
          {Array.from({ length: teamCount }, (_, i) => i + 1).map(n => {
            const style = TEAM_STYLES[n]
            const isActive = selectedTeam === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedTeam(n)}
                className={`px-2 py-1 rounded font-bold transition-colors ${isActive ? style.btnActive : style.btnInactive}`}
              >
                {style.label}
              </button>
            )
          })}
          {teamCount < MAX_TEAMS && (
            <button
              type="button"
              onClick={handleAddTeam}
              className="px-2 py-1 rounded font-bold border border-dashed border-border text-foreground-muted hover:text-foreground hover:border-accent/50 transition-colors flex items-center gap-1"
              title="Add another team (up to 4)"
            >
              <Plus className="w-3 h-3" /> Team
            </button>
          )}
        </div>
      )}

      {/* Search field — always visible */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any wrestler in Hot Tag..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
        />
        {searching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-foreground-muted" />
        )}
      </div>

      {/* Your Roster group */}
      {rosterWrestlers.length > 0 ? (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted mb-2">
            Your Roster · {rosterWrestlers.length} active
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {rosterWrestlers.map(renderTile)}
          </div>
        </div>
      ) : (
        <div className="text-xs text-foreground-muted py-2">
          No active roster yet.{' '}
          {emptyRosterHref && (
            <a href={emptyRosterHref} className="text-accent hover:underline">Manage your roster →</a>
          )}
        </div>
      )}

      {/* More from Hot Tag — only when query is active */}
      {query.length >= 2 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted mb-2">
            More from Hot Tag {moreResults.length > 0 && `· ${moreResults.length}`}
          </div>
          {moreResults.length > 0 ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {moreResults.map(renderTile)}
            </div>
          ) : !searching && (
            <p className="text-xs text-foreground-muted">No additional wrestlers found.</p>
          )}
        </div>
      )}
    </div>
  )
}
