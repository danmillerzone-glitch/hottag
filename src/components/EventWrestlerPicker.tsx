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
  /** Pre-fetched union of co-promoter rosters for the event. */
  rosterWrestlers: RosterWrestler[]
  /** Wrestler IDs currently in the parent context (announced list or this match). */
  selectedIds: string[]
  /** Determines tile coloring and tap behavior. */
  mode: EventWrestlerPickerMode
  /** Only relevant in match mode for tag-style matches. */
  matchTeams?: MatchTeamMember[]
  /** True when the parent match is Tag Team / 6-Man Tag / 8-Man Tag. */
  showTeamToggle?: boolean
  /** Callback when a tile is tapped to add. In match mode, includes the selected team. */
  onAdd: (wrestlerId: string, team?: 1 | 2) => void
  /** Callback when an already-added tile is tapped (same team in match mode). */
  onRemove: (wrestlerId: string) => void
  /** Callback when a different-team tile is tapped in match mode (one-tap swap). */
  onSwap?: (wrestlerId: string, toTeam: 1 | 2) => void
  /** Optional empty-roster CTA href (e.g. link to roster dashboard). */
  emptyRosterHref?: string
}

export default function EventWrestlerPicker(props: EventWrestlerPickerProps) {
  return (
    <div className="rounded-lg bg-background-tertiary border border-border p-3">
      {/* Skeleton — implemented in subsequent tasks */}
      <p className="text-xs text-foreground-muted">Picker placeholder ({props.mode} mode, {props.rosterWrestlers.length} roster)</p>
    </div>
  )
}
