'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Search, Check, Plus, User, Loader2 } from 'lucide-react'
import { searchWrestlers, type RosterWrestler } from '@/lib/promoter'

export type EventWrestlerPickerMode = 'announced' | 'match'

export interface MatchTeamMember {
  wrestlerId: string
  team: 1 | 2
}

export interface EventWrestlerPickerProps {
  rosterWrestlers: RosterWrestler[]
  selectedIds: string[]
  mode: EventWrestlerPickerMode
  matchTeams?: MatchTeamMember[]
  showTeamToggle?: boolean
  onAdd: (wrestlerId: string, team?: 1 | 2) => void
  onRemove: (wrestlerId: string) => void
  onSwap?: (wrestlerId: string, toTeam: 1 | 2) => void
  emptyRosterHref?: string
}

type TileState = 'neutral' | 'added' | 'team1' | 'team2'

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
  const [selectedTeam, setSelectedTeam] = useState<1 | 2>(1)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const teamMap = useMemo(() => {
    const m = new Map<string, 1 | 2>()
    for (const t of matchTeams) m.set(t.wrestlerId, t.team)
    return m
  }, [matchTeams])

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

  // Determine what visual state a tile should have for a given wrestler
  const getTileState = (wrestlerId: string): TileState => {
    if (mode === 'announced') {
      return selectedSet.has(wrestlerId) ? 'added' : 'neutral'
    }
    // match mode
    if (!selectedSet.has(wrestlerId)) return 'neutral'
    if (showTeamToggle) {
      const team = teamMap.get(wrestlerId)
      if (team === 1) return 'team1'
      if (team === 2) return 'team2'
    }
    return 'added' // singles, battle royal, etc.
  }

  const handleTileTap = (wrestlerId: string) => {
    const state = getTileState(wrestlerId)
    if (mode === 'announced') {
      if (state === 'added') onRemove(wrestlerId)
      else onAdd(wrestlerId)
      return
    }
    // match mode
    if (state === 'neutral') {
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

  const renderTile = (w: RosterWrestler) => {
    const state = getTileState(w.id)
    const stateClasses: Record<TileState, string> = {
      neutral: 'bg-background border border-border hover:border-accent/50 text-foreground',
      added: 'bg-accent/15 border border-accent text-foreground',
      team1: 'bg-blue-500/15 border border-blue-400 text-foreground',
      team2: 'bg-red-500/15 border border-red-400 text-foreground',
    }
    const iconForState = () => {
      if (state === 'neutral') return <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-background-tertiary rounded-full p-0.5 text-foreground-muted" />
      if (state === 'added') return <Check className="w-3 h-3 absolute -top-1 -right-1 bg-accent text-background rounded-full p-0.5" />
      if (state === 'team1') return <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">1</span>
      if (state === 'team2') return <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">2</span>
      return null
    }
    return (
      <button
        key={w.id}
        type="button"
        onClick={() => handleTileTap(w.id)}
        className={`relative flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${stateClasses[state]}`}
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
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foreground-muted">NEXT TAP →</span>
          <button
            type="button"
            onClick={() => setSelectedTeam(1)}
            className={`px-2 py-1 rounded font-bold transition-colors ${selectedTeam === 1 ? 'bg-blue-500 text-white' : 'bg-background border border-border text-foreground-muted hover:text-foreground'}`}
          >
            🔵 Team 1
          </button>
          <button
            type="button"
            onClick={() => setSelectedTeam(2)}
            className={`px-2 py-1 rounded font-bold transition-colors ${selectedTeam === 2 ? 'bg-red-500 text-white' : 'bg-background border border-border text-foreground-muted hover:text-foreground'}`}
          >
            🔴 Team 2
          </button>
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
