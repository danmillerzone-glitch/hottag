# Event Card Builder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slow search-and-click flow for adding wrestlers to events with a tap-to-toggle roster picker shared between Announced Talent and Match Card sections, and fix the bug where match-only wrestlers don't appear on their own wrestler page.

**Architecture:** One new shared component (`EventWrestlerPicker`) reused in two contexts. Add a data invariant in the application layer: every wrestler in any match must also have an `event_announced_talent` row for that event. A one-time SQL backfill cleans up historical data so the wrestler-profile bug is retroactively fixed without changing any read queries.

**Tech Stack:** Next.js 14 (App Router), React (client components), TypeScript, Tailwind CSS, Supabase (PostgreSQL + RLS)

**Spec:** `docs/superpowers/specs/2026-04-06-event-card-builder-redesign-design.md`

**Testing model:** This project has no automated test infrastructure. Each task ends with a manual browser verification step (`cd src && npm run dev` → `localhost:3000`). Task 13 is a full end-to-end smoke test that exercises every code path.

**Hard constraint (do not violate):** This redesign only changes *how wrestlers are added* to events and matches. It MUST NOT alter the visual layout of:
- The match header (number badge, title, type, stipulation, edit/delete buttons) in `MatchItem`
- The participant chip rendering (with VS divider for team matches) in `MatchItem`
- The announced-talent row layout (sort arrows, photo, name, note input, trash button) in `AnnouncedTalentSection`
- Any other dashboard section

If you find yourself editing `renderParticipant`, the match header JSX, or the existing announced-talent `talent.map(...)` row JSX, stop — you've gone outside scope.

---

## File Structure

**New files:**
- `src/components/EventWrestlerPicker.tsx` — the shared picker component (one file, ~200 lines, single responsibility)
- `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql` — one-time backfill SQL

**Modified files:**
- `src/lib/promoter.ts` — add 3 new functions, modify `addMatchParticipant`
- `src/components/DashboardEventSections.tsx` — modify `AnnouncedTalentSection`, `MatchCardSection`, `MatchItem`; delete `WrestlerSearchBox`
- `src/app/dashboard/events/[id]/page.tsx` — pre-fetch roster, pass to sections

---

### Task 1: Add `getRosterForEventPromotions` to promoter.ts

Fetches the union of active rosters across all promotions linked to the event (handles co-promoted shows).

**Files:**
- Modify: `src/lib/promoter.ts`

- [ ] **Step 1: Add the `RosterWrestler` type next to the existing types**

Add this type definition near the other interfaces in `src/lib/promoter.ts` (alongside `EventMatch`, `MatchParticipant`, etc., around line 87):

```ts
export interface RosterWrestler {
  id: string
  name: string
  slug: string
  photo_url: string | null
}
```

- [ ] **Step 2: Add the `getRosterForEventPromotions` function**

Add this function in the ROSTER MANAGEMENT section of `src/lib/promoter.ts` (after `removeFromRoster`, around line 1102):

```ts
/**
 * Returns the union of active rosters across all promotions linked to an event.
 * For co-promoted shows, this is the deduplicated set of every co-promoter's
 * active roster. Sorted alphabetically by wrestler name.
 */
export async function getRosterForEventPromotions(eventId: string): Promise<RosterWrestler[]> {
  const supabase = createClient()

  // Step 1: get all promotion IDs linked to this event
  const { data: eventPromos, error: epError } = await supabase
    .from('event_promotions')
    .select('promotion_id')
    .eq('event_id', eventId)

  if (epError) {
    console.error('Error fetching event promotions:', epError)
    return []
  }

  const promotionIds = (eventPromos || []).map((ep: any) => ep.promotion_id)
  if (promotionIds.length === 0) return []

  // Step 2: get active roster members across all those promotions
  const { data, error } = await supabase
    .from('wrestler_promotions')
    .select('wrestlers (id, name, slug, photo_url)')
    .in('promotion_id', promotionIds)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching event roster:', error)
    return []
  }

  // Step 3: dedupe by wrestler ID and sort alphabetically
  const seen = new Set<string>()
  const unique: RosterWrestler[] = []
  for (const row of (data || []) as any[]) {
    const w = row.wrestlers
    if (!w || seen.has(w.id)) continue
    seen.add(w.id)
    unique.push(w as RosterWrestler)
  }
  unique.sort((a, b) => a.name.localeCompare(b.name))
  return unique
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no errors related to `promoter.ts`. (Pre-existing errors elsewhere in the project are fine — only this file matters.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/promoter.ts
git commit -m "feat(promoter): add getRosterForEventPromotions for event picker"
```

---

### Task 2: Add `getMatchParticipationForWrestler` to promoter.ts

Powers the cascade-confirm dialog when removing an announced wrestler who is also in a match.

**Files:**
- Modify: `src/lib/promoter.ts`

- [ ] **Step 1: Add the function**

Add this function in the MATCH MANAGEMENT FUNCTIONS section, immediately after `removeMatchParticipant` (around line 488):

```ts
/**
 * Returns the matches in a given event that have the wrestler as a participant.
 * Used by the cascade-confirm flow when removing announced talent.
 */
export async function getMatchParticipationForWrestler(
  eventId: string,
  wrestlerId: string
): Promise<{ matchId: string; matchTitle: string | null; matchOrder: number | null }[]> {
  const supabase = createClient()

  // Get all matches for this event with their participants filtered to this wrestler
  const { data, error } = await supabase
    .from('event_matches')
    .select('id, match_title, match_order, match_participants!inner(wrestler_id)')
    .eq('event_id', eventId)
    .eq('match_participants.wrestler_id', wrestlerId)

  if (error) {
    console.error('Error fetching wrestler match participation:', error)
    return []
  }

  return (data || []).map((m: any) => ({
    matchId: m.id,
    matchTitle: m.match_title,
    matchOrder: m.match_order,
  }))
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no new errors in `promoter.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/promoter.ts
git commit -m "feat(promoter): add getMatchParticipationForWrestler for cascade-confirm"
```

---

### Task 3: Add `updateMatchParticipantTeam` and modify `addMatchParticipant`

Adds the team-swap path used by the picker, and enforces the data invariant on the add path.

**Files:**
- Modify: `src/lib/promoter.ts:460-478`

- [ ] **Step 1: Add `updateMatchParticipantTeam`**

Add this function in the MATCH MANAGEMENT FUNCTIONS section, immediately after `removeMatchParticipant`:

```ts
/**
 * Move a wrestler between team 1 and team 2 in a match. Used when the user
 * taps a wrestler tile that's already in the match but on the other team —
 * this is a one-tap swap rather than remove+add.
 */
export async function updateMatchParticipantTeam(
  matchId: string,
  wrestlerId: string,
  teamNumber: 1 | 2
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('match_participants')
    .update({ team_number: teamNumber })
    .eq('match_id', matchId)
    .eq('wrestler_id', wrestlerId)

  if (error) throw error
}
```

- [ ] **Step 2: Modify `addMatchParticipant` to upsert announced talent**

Replace the existing `addMatchParticipant` function (currently at lines 460-478 of `src/lib/promoter.ts`) with this version. The change adds an `event_id` parameter (so we don't have to look it up) and a follow-up upsert into `event_announced_talent`:

```ts
export async function addMatchParticipant(data: {
  match_id: string
  event_id: string
  wrestler_id: string
  team_number?: number
}) {
  const supabase = createClient()

  // 1. Insert the match participant (primary intent)
  const { data: participant, error } = await supabase
    .from('match_participants')
    .insert({
      match_id: data.match_id,
      wrestler_id: data.wrestler_id,
      team_number: data.team_number,
    })
    .select(`
      *,
      wrestlers (id, name, slug, photo_url)
    `)
    .single()

  if (error) throw error

  // 2. Maintain the invariant: every match participant must also be in
  //    event_announced_talent for that event. Idempotent — succeeds-or-noops.
  //    We do not roll back step 1 if this fails; the participant insert is the
  //    user's primary intent and the backfill migration is a safety net.
  try {
    // Compute the next sort_order for this event
    const { data: existing } = await supabase
      .from('event_announced_talent')
      .select('sort_order')
      .eq('event_id', data.event_id)
      .order('sort_order', { ascending: false })
      .limit(1)
    const nextSortOrder = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0

    await supabase
      .from('event_announced_talent')
      .upsert(
        {
          event_id: data.event_id,
          wrestler_id: data.wrestler_id,
          sort_order: nextSortOrder,
          self_announced: false,
        },
        { onConflict: 'event_id,wrestler_id', ignoreDuplicates: true }
      )
  } catch (upsertErr) {
    console.error('Failed to upsert announced talent (non-fatal):', upsertErr)
  }

  return participant
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: TypeScript will complain about callers of `addMatchParticipant` missing the new `event_id` argument. There's exactly one caller in [src/components/DashboardEventSections.tsx](src/components/DashboardEventSections.tsx) (in `MatchItem.handleAddWrestler`). That call site will be replaced entirely in Task 10 — for now, leave the TS error in place; it'll be resolved then.

- [ ] **Step 4: Commit**

```bash
git add src/lib/promoter.ts
git commit -m "feat(promoter): enforce match→announced talent invariant on add"
```

---

### Task 4: Create the backfill SQL migration file

Adds historical `event_announced_talent` rows for every existing match participant. This file gets committed now and run manually in Task 13.

**Files:**
- Create: `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql`

- [ ] **Step 1: Write the migration file**

Create `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql` with this content:

```sql
-- One-time backfill: ensure every wrestler in any match has a corresponding
-- event_announced_talent row for that match's event. After running this,
-- the wrestler-profile "Upcoming Events" bug (where match-only wrestlers
-- were silently invisible on their own page) is retroactively fixed for
-- all historical data.
--
-- Idempotent: the NOT EXISTS filter makes re-runs no-ops.
-- Safe: uses sort_order = (max for that event) + N so backfilled rows
-- append to the end of any existing announced list rather than colliding.

INSERT INTO event_announced_talent (event_id, wrestler_id, sort_order, self_announced)
SELECT DISTINCT
  em.event_id,
  mp.wrestler_id,
  COALESCE((
    SELECT MAX(sort_order) + 1
    FROM event_announced_talent
    WHERE event_id = em.event_id
  ), 0) AS sort_order,
  false AS self_announced
FROM match_participants mp
JOIN event_matches em ON em.id = mp.match_id
WHERE NOT EXISTS (
  SELECT 1 FROM event_announced_talent eat
  WHERE eat.event_id = em.event_id
    AND eat.wrestler_id = mp.wrestler_id
);
```

- [ ] **Step 2: Verify the SQL parses (smoke check)**

Open the file and re-read it. Confirm:
- Column list and SELECT list match (4 columns each)
- The `NOT EXISTS` is keyed on `(event_id, wrestler_id)` matching the unique constraint on `event_announced_talent`
- No trailing semicolons or syntax errors

(No DB execution yet — that happens in Task 13.)

- [ ] **Step 3: Commit**

```bash
git add database/migration-2026-04-07-backfill-announced-talent-from-matches.sql
git commit -m "feat(db): backfill announced talent from match participants"
```

---

### Task 5: Create EventWrestlerPicker skeleton (types + props + empty render)

Creates the new component file with the full TypeScript prop contract and a minimal render scaffold. No behavior yet — just the shape.

**Files:**
- Create: `src/components/EventWrestlerPicker.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/EventWrestlerPicker.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no errors in `EventWrestlerPicker.tsx`. (Errors in `DashboardEventSections.tsx` from Task 3 may still be present.)

- [ ] **Step 3: Commit**

```bash
git add src/components/EventWrestlerPicker.tsx
git commit -m "feat(picker): add EventWrestlerPicker skeleton with prop contract"
```

---

### Task 6: Implement EventWrestlerPicker — search field, roster tiles, tap behavior

Fills in the actual picker behavior: search field at top, "Your Roster" grid, "More from Hot Tag" search results, tap-to-toggle tiles in both modes, team toggle row for tag matches.

**Files:**
- Modify: `src/components/EventWrestlerPicker.tsx`

- [ ] **Step 1: Replace the file with the full implementation**

Replace the entire contents of `src/components/EventWrestlerPicker.tsx` with:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no errors in `EventWrestlerPicker.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventWrestlerPicker.tsx
git commit -m "feat(picker): implement EventWrestlerPicker search, roster grid, tap behavior"
```

---

### Task 7: Pre-fetch roster in ManageEventPage and pass to sections

Loads the union-of-rosters once when the manage page loads and passes it down to both the announced talent and match card sections.

**Files:**
- Modify: `src/app/dashboard/events/[id]/page.tsx`

- [ ] **Step 1: Import the new function and type**

In `src/app/dashboard/events/[id]/page.tsx`, update the import block at lines 9-11:

```tsx
import {
  getEventForEditing, getEventMatches, getStreamingLinks, getAnnouncedTalent,
  getRosterForEventPromotions,
  type EventMatch, type StreamingLink, type AnnouncedTalent, type RosterWrestler,
} from '@/lib/promoter'
```

- [ ] **Step 2: Add roster state**

Add a new state hook alongside the existing ones (around line 28, after `announcedTalent`):

```tsx
const [rosterWrestlers, setRosterWrestlers] = useState<RosterWrestler[]>([])
```

- [ ] **Step 3: Fetch roster in `loadEvent`**

In `loadEvent` (around line 80), update the `Promise.all` to also fetch the roster:

```tsx
const [eventMatches, links, talent, roster] = await Promise.all([
  getEventMatches(eventId),
  getStreamingLinks(eventId),
  getAnnouncedTalent(eventId),
  getRosterForEventPromotions(eventId),
])
setMatches(eventMatches)
setStreamingLinks(links)
setAnnouncedTalent(talent)
setRosterWrestlers(roster)
```

- [ ] **Step 4: Pass `rosterWrestlers` to the two sections**

In the JSX (around lines 219-221), update the section components to receive the roster:

```tsx
<AnnouncedTalentSection
  eventId={eventId}
  talent={announcedTalent}
  rosterWrestlers={rosterWrestlers}
  onUpdate={setAnnouncedTalent}
/>
<AnnouncedCrewSection eventId={eventId} />
<MatchCardSection
  eventId={eventId}
  matches={matches}
  rosterWrestlers={rosterWrestlers}
  onUpdate={setMatches}
/>
```

- [ ] **Step 5: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: TypeScript will complain that `AnnouncedTalentSection` and `MatchCardSection` don't accept `rosterWrestlers`. That's expected — Tasks 8 and 10 add those props. Leave the errors for now.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/events/[id]/page.tsx
git commit -m "feat(manage-event): pre-fetch roster for picker components"
```

---

### Task 8: Replace AnnouncedTalentSection's add UI with the picker

Drops the [+ Add Talent] button + `WrestlerSearchBox` flow and mounts `EventWrestlerPicker` always-visible above the existing announced list. The existing announced-list rendering (sort arrows, photo, name, note input, trash button) is left untouched.

**Files:**
- Modify: `src/components/DashboardEventSections.tsx` (the `AnnouncedTalentSection` function, lines 606-733)

- [ ] **Step 1: Add the import**

At the top of `src/components/DashboardEventSections.tsx`, add this import after the existing imports (around line 12):

```tsx
import EventWrestlerPicker from '@/components/EventWrestlerPicker'
import type { RosterWrestler } from '@/lib/promoter'
```

Also add `getMatchParticipationForWrestler` to the existing `@/lib/promoter` import block at line 5:

```tsx
import {
  updateEvent, getEventMatches, createMatch, deleteMatch, updateMatch, addMatchParticipant, removeMatchParticipant,
  updateMatchParticipantTeam,
  searchWrestlers, uploadEventPoster, getStreamingLinks, addStreamingLink, deleteStreamingLink,
  getAnnouncedTalent, addAnnouncedTalent, removeAnnouncedTalent, updateAnnouncedTalent,
  getMatchParticipationForWrestler,
  getAnnouncedCrew, addAnnouncedCrew, removeAnnouncedCrew, updateAnnouncedCrew, searchProfessionals,
  getEventWrestlersLinked, removeEventWrestlerLink,
  type EventMatch, type StreamingLink, type AnnouncedTalent,
} from '@/lib/promoter'
```

- [ ] **Step 2: Replace the `AnnouncedTalentSection` function**

Replace the entire `AnnouncedTalentSection` function (currently lines 606-733) with this version. Note: the existing announced-list JSX (the `talent.map(...)` block with sort arrows, photo, name, note input, and trash button) is preserved character-for-character — only the search and add/remove flows change.

```tsx
export function AnnouncedTalentSection({
  eventId,
  talent,
  rosterWrestlers,
  onUpdate,
}: {
  eventId: string
  talent: AnnouncedTalent[]
  rosterWrestlers: RosterWrestler[]
  onUpdate: (t: AnnouncedTalent[]) => void
}) {
  const handleAdd = async (wrestlerId: string) => {
    try {
      const added = await addAnnouncedTalent({
        event_id: eventId,
        wrestler_id: wrestlerId,
        sort_order: talent.length,
      })
      onUpdate([...talent, added])
    } catch (err: any) {
      if (err?.code !== '23505') console.error('Error adding talent:', err)
    }
  }

  // Cascade-confirm: if the wrestler is in any match, ask before removing.
  const handleRemoveByWrestlerId = async (wrestlerId: string) => {
    const talentRow = talent.find(t => t.wrestler_id === wrestlerId)
    if (!talentRow) return

    try {
      const matchParticipation = await getMatchParticipationForWrestler(eventId, wrestlerId)
      if (matchParticipation.length > 0) {
        const matchLabels = matchParticipation
          .map(m => `Match #${m.matchOrder ?? '?'}: ${m.matchTitle || `Match ${m.matchOrder ?? ''}`}`)
          .join('\n')
        const ok = window.confirm(
          `${talentRow.wrestlers?.name || 'This wrestler'} is currently in:\n\n${matchLabels}\n\nRemoving them from Announced Talent will also remove them from the match. Continue?`
        )
        if (!ok) return

        // Delete all match_participants rows for this wrestler in this event's matches
        const supabase = (await import('@/lib/supabase-browser')).createClient()
        for (const m of matchParticipation) {
          await supabase
            .from('match_participants')
            .delete()
            .eq('match_id', m.matchId)
            .eq('wrestler_id', wrestlerId)
        }
      }

      await removeAnnouncedTalent(talentRow.id)
      onUpdate(talent.filter(t => t.id !== talentRow.id))
    } catch (err) {
      console.error('Error removing talent:', err)
    }
  }

  // Existing trash-button handler (unchanged behavior path: directly remove by talent.id)
  const handleRemove = async (talentId: string) => {
    const t = talent.find(x => x.id === talentId)
    if (!t) return
    await handleRemoveByWrestlerId(t.wrestler_id)
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= talent.length) return
    const updated = [...talent]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    onUpdate(updated)
    try {
      await Promise.all([
        updateAnnouncedTalent(updated[index].id, { sort_order: index }),
        updateAnnouncedTalent(updated[newIndex].id, { sort_order: newIndex }),
      ])
    } catch (err) { console.error('Error reordering:', err) }
  }

  const handleUpdateNote = async (talentId: string, note: string) => {
    try {
      await updateAnnouncedTalent(talentId, { announcement_note: note || null })
      onUpdate(talent.map(t => t.id === talentId ? { ...t, announcement_note: note || null } : t))
    } catch (err) { console.error('Error updating note:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Announced Talent</h2>
          <span className="text-sm text-foreground-muted">({talent.length})</span>
        </div>
      </div>

      <p className="text-xs text-foreground-muted mb-4">
        Tap a roster wrestler to add. Tap again to remove. Search the field for any wrestler in Hot Tag.
      </p>

      {/* Always-visible picker above the announced list */}
      <div className="mb-4">
        <EventWrestlerPicker
          rosterWrestlers={rosterWrestlers}
          selectedIds={talent.map(t => t.wrestler_id)}
          mode="announced"
          onAdd={handleAdd}
          onRemove={handleRemoveByWrestlerId}
        />
      </div>

      {talent.length > 0 ? (
        <div className="space-y-2 mb-4">
          {talent.map((t, index) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border border-border group">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="p-0.5 rounded hover:bg-background text-foreground-muted hover:text-foreground disabled:opacity-20 disabled:cursor-default transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === talent.length - 1}
                  className="p-0.5 rounded hover:bg-background text-foreground-muted hover:text-foreground disabled:opacity-20 disabled:cursor-default transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              {t.wrestlers?.photo_url ? (
                <Image src={t.wrestlers.photo_url} alt={t.wrestlers?.name || ''} width={32} height={32} className="w-8 h-8 rounded-lg object-cover object-top" unoptimized />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                  <User className="w-4 h-4 text-foreground-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {t.wrestlers?.name}
                  {t.self_announced && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">self-announced</span>
                  )}
                </div>
                <input
                  type="text"
                  value={t.announcement_note || ''}
                  onChange={(e) => onUpdate(talent.map(item => item.id === t.id ? { ...item, announcement_note: e.target.value } : item))}
                  onBlur={(e) => handleUpdateNote(t.id, e.target.value)}
                  placeholder="Add note (e.g., Championship Opportunity)"
                  className="text-xs text-foreground-muted bg-transparent outline-none w-full placeholder:text-foreground-muted/30 mt-0.5"
                />
              </div>
              <button onClick={() => handleRemove(t.id)} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground-muted mb-4">No talent announced yet.</p>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: still some errors in `MatchCardSection` and `MatchItem` from earlier tasks, but no new errors in `AnnouncedTalentSection`. Confirm the only remaining errors involve `addMatchParticipant` (resolved in Task 10) and `MatchCardSection` not yet accepting `rosterWrestlers` (resolved in Task 9).

- [ ] **Step 4: Manual smoke test**

Run: `cd src && npm run dev`

In the browser:
1. Sign in as Dan's promoter account, open any event with co-promoters set to a real promotion that has an active roster.
2. Confirm the Announced Talent section shows the always-visible picker with the roster wrestlers as tiles.
3. Tap a roster wrestler tile — it should immediately appear in the announced list below, and the tile should switch to the "added" (orange) state.
4. Tap the same tile again — it should remove from the announced list and revert.
5. Type a wrestler name not in the roster — the "More from Hot Tag" group should appear with results. Tap one — it should add to the announced list.
6. The existing trash button on a row should still work; if the wrestler is in a match, the cascade-confirm dialog should appear.

(If the page hard-errors because Task 9 hasn't been done yet, that's fine — `MatchCardSection` props mismatch can show as a TS warning at runtime. Just verify the announced section renders.)

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardEventSections.tsx
git commit -m "feat(announced-talent): replace search box with EventWrestlerPicker"
```

---

### Task 9: Add per-section "expanded match" state to MatchCardSection

Adds the `expandedMatchId` state in `MatchCardSection` so only one match's picker can be open at a time. Passes through to each `MatchItem`.

**Files:**
- Modify: `src/components/DashboardEventSections.tsx` (the `MatchCardSection` function, lines 739-880)

- [ ] **Step 1: Update the `MatchCardSection` props and add expanded state**

Find `MatchCardSection` (around line 739). Update its signature and add an `expandedMatchId` state:

```tsx
export function MatchCardSection({
  eventId,
  matches,
  rosterWrestlers,
  onUpdate,
}: {
  eventId: string
  matches: EventMatch[]
  rosterWrestlers: RosterWrestler[]
  onUpdate: (m: EventMatch[]) => void
}) {
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [newMatchTitle, setNewMatchTitle] = useState('')
  const [newMatchType, setNewMatchType] = useState('')
  const [newStipulation, setNewStipulation] = useState('')
  const [isTitleMatch, setIsTitleMatch] = useState(false)
  const [championshipName, setChampionshipName] = useState('')
  const [addingMatch, setAddingMatch] = useState(false)
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)

  // ... existing handlers (handleAddMatch, handleDeleteMatch, handleMoveMatch, handleReloadMatches) unchanged ...
```

(Keep all the existing handler functions exactly as they are.)

- [ ] **Step 2: Update the MatchItem invocation in the JSX**

Find the existing `<MatchItem ... />` invocation inside `MatchCardSection` (around line 813). Replace it with this version that passes the new props:

```tsx
<MatchItem
  match={match}
  index={index}
  eventId={eventId}
  rosterWrestlers={rosterWrestlers}
  isExpanded={expandedMatchId === match.id}
  onExpand={() => setExpandedMatchId(match.id)}
  onCollapse={() => setExpandedMatchId(null)}
  onDelete={() => handleDeleteMatch(match.id)}
  onReload={handleReloadMatches}
/>
```

- [ ] **Step 3: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: TS will complain that `MatchItem` doesn't accept the new props. That's expected — Task 10 fixes it.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardEventSections.tsx
git commit -m "feat(match-card): add expandedMatchId state for single-picker UX"
```

---

### Task 10: Replace MatchItem's add-wrestler UI with the picker

Replaces the `WrestlerSearchBox`-based flow inside `MatchItem` with `EventWrestlerPicker` (collapsed by default, expanded one at a time). The match header, participant chips, edit form, and edit/delete buttons must remain untouched.

**HARD CONSTRAINT REMINDER:** Only the bottom-of-card "Add wrestler" area changes. The match header (`<div className="flex items-start justify-between mb-3">...`), the participant rendering (`renderParticipant`), and the team1/VS/team2 layout MUST be left exactly as they are.

**Files:**
- Modify: `src/components/DashboardEventSections.tsx` (the `MatchItem` function, lines 886-1049)

- [ ] **Step 1: Replace the `MatchItem` function signature**

Find `MatchItem` (around line 886). Update its signature and props:

```tsx
function MatchItem({
  match,
  index,
  eventId,
  rosterWrestlers,
  isExpanded,
  onExpand,
  onCollapse,
  onDelete,
  onReload,
}: {
  match: EventMatch
  index: number
  eventId: string
  rosterWrestlers: RosterWrestler[]
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onDelete: () => void
  onReload: () => void
}) {
```

- [ ] **Step 2: Remove obsolete state and update handlers**

Inside `MatchItem`, remove these lines (the old picker state):
```tsx
const [showAddWrestler, setShowAddWrestler] = useState(false)
const [teamNumber, setTeamNumber] = useState(1)
```

Replace `handleAddWrestler` (currently around line 914) with this version that includes the team parameter and event_id:

```tsx
const handleAddWrestler = async (wrestlerId: string, team?: 1 | 2) => {
  try {
    await addMatchParticipant({
      match_id: match.id,
      event_id: eventId,
      wrestler_id: wrestlerId,
      team_number: team ?? 1,
    })
    onReload()
  } catch (err) { console.error('Error adding wrestler:', err) }
}
```

Add a `handleRemoveWrestler` handler (next to `handleAddWrestler`) that removes by wrestler ID rather than participant ID, since the picker only knows wrestler IDs:

```tsx
const handleRemoveWrestler = async (wrestlerId: string) => {
  const participant = participants.find(p => p.wrestler_id === wrestlerId)
  if (!participant) return
  try {
    await removeMatchParticipant(participant.id)
    onReload()
  } catch (err) { console.error('Error removing participant:', err) }
}
```

Add a `handleSwapTeam` handler:

```tsx
const handleSwapTeam = async (wrestlerId: string, toTeam: 1 | 2) => {
  try {
    await updateMatchParticipantTeam(match.id, wrestlerId, toTeam)
    onReload()
  } catch (err) { console.error('Error swapping team:', err) }
}
```

(Leave the existing `handleRemoveParticipant` function alone — it's still used by the chip's X button on hover, which is part of the participant chip layout we promised not to touch.)

- [ ] **Step 3: Replace the bottom add-wrestler block ONLY**

In the `return` statement of `MatchItem`, find the block that currently looks like this (around lines 1025-1046):

```tsx
{showAddWrestler ? (
  <div className="mt-3">
    {(match.match_type === 'Tag Team' || match.match_type === '6-Man Tag' || match.match_type === '8-Man Tag') && (
      <div className="mb-2">
        <select value={teamNumber} onChange={(e) => setTeamNumber(parseInt(e.target.value))}
          className="px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none">
          <option value={1}>Team 1</option>
          <option value={2}>Team 2</option>
        </select>
      </div>
    )}
    <WrestlerSearchBox
      onSelect={handleAddWrestler}
      onClose={() => setShowAddWrestler(false)}
      excludeIds={participants.map(p => p.wrestler_id)}
    />
  </div>
) : (
  <button onClick={() => setShowAddWrestler(true)} className="mt-3 text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
    <Plus className="w-3.5 h-3.5" /> Add wrestler
  </button>
)}
```

Replace it with this block that uses the picker:

```tsx
{isExpanded ? (
  <div className="mt-3 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground-muted">Tap to add. Tap again to remove.</span>
      <button
        type="button"
        onClick={onCollapse}
        className="text-xs text-foreground-muted hover:text-foreground"
      >
        Done
      </button>
    </div>
    <EventWrestlerPicker
      rosterWrestlers={rosterWrestlers}
      selectedIds={participants.map(p => p.wrestler_id)}
      mode="match"
      matchTeams={participants.map(p => ({ wrestlerId: p.wrestler_id, team: (p.team_number === 2 ? 2 : 1) as 1 | 2 }))}
      showTeamToggle={match.match_type === 'Tag Team' || match.match_type === '6-Man Tag' || match.match_type === '8-Man Tag'}
      onAdd={handleAddWrestler}
      onRemove={handleRemoveWrestler}
      onSwap={handleSwapTeam}
    />
  </div>
) : (
  <button
    type="button"
    onClick={onExpand}
    className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent text-sm text-accent hover:text-accent-hover flex items-center justify-center gap-1 transition-colors"
  >
    <Plus className="w-3.5 h-3.5" /> Add wrestler
  </button>
)}
```

**STOP and verify:** Did you change anything above this block in the `return` statement? If yes, revert it. The match header, the participant chips, and the team1/VS/team2 layout must be byte-identical to before.

- [ ] **Step 4: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no errors in `DashboardEventSections.tsx`. (If you see errors about `WrestlerSearchBox`, that's fine — it's still defined, just unused now. Task 12 deletes it.)

- [ ] **Step 5: Manual smoke test**

Run: `cd src && npm run dev`

In the browser, on an event with at least one match:

1. The Match Card section renders with the same layout as before — number badge, title, type, stipulation, edit/delete, participant chips with VS divider for tag matches.
2. The "+ Add wrestler" button at the bottom of each match is now a dashed-border button instead of a plain text link. The match card otherwise looks identical.
3. Click "+ Add wrestler" on Match #1 — picker expands inside that match item only.
4. Click "+ Add wrestler" on Match #2 — Match #1's picker collapses, Match #2's expands. Only one open at a time.
5. In a Tag Team match, the picker shows the 🔵 Team 1 / 🔴 Team 2 toggle. Tap a tile — it joins the selected team. Tile shows the team number badge.
6. Tap a wrestler already in the same team — they're removed.
7. Tap a wrestler in the OTHER team — they swap to the selected team in one tap (no dialog).
8. Add a wrestler to a match — open the Announced Talent section above. The wrestler should now appear there too (the invariant working live).
9. Click "Done" to collapse the picker.

- [ ] **Step 6: Commit**

```bash
git add src/components/DashboardEventSections.tsx
git commit -m "feat(match-card): replace WrestlerSearchBox with EventWrestlerPicker"
```

---

### Task 11: Delete the now-unused `WrestlerSearchBox`

After the integration tasks, `WrestlerSearchBox` has zero callers. Delete it. (`AnnouncedCrewSection` and `LinkedWrestlersSection` use a different inline pattern, not `WrestlerSearchBox` — verified during planning.)

**Files:**
- Modify: `src/components/DashboardEventSections.tsx` (lines ~1051-1111)

- [ ] **Step 1: Confirm zero callers**

Run: `cd src && npx tsc --noEmit && grep -rn "WrestlerSearchBox" src/`
Expected: only the function declaration itself in `DashboardEventSections.tsx` and possibly the comment header above it. No other references anywhere.

- [ ] **Step 2: Delete the function**

In `src/components/DashboardEventSections.tsx`, delete the entire block from:

```tsx
// ============================================
// SHARED WRESTLER SEARCH BOX
// ============================================

function WrestlerSearchBox({ ... }) {
  // ... full body ...
}
```

through to the closing `}` of the function. (The next section header `// ANNOUNCED CREW SECTION` should be left in place.)

- [ ] **Step 3: Verify it compiles**

Run: `cd src && npx tsc --noEmit`
Expected: no errors anywhere in the project related to `WrestlerSearchBox`.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardEventSections.tsx
git commit -m "refactor: delete unused WrestlerSearchBox component"
```

---

### Task 12: Run the backfill SQL migration

Manual step: paste the SQL from Task 4 into the Supabase SQL editor against the production database.

**Files:**
- Run: `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql`

- [ ] **Step 1: Open Supabase SQL editor**

Go to the Hot Tag Supabase project in the browser. Open the SQL editor.

- [ ] **Step 2: Run a pre-flight count**

First, count how many rows the backfill will insert (without inserting):

```sql
SELECT COUNT(*) FROM (
  SELECT DISTINCT em.event_id, mp.wrestler_id
  FROM match_participants mp
  JOIN event_matches em ON em.id = mp.match_id
  WHERE NOT EXISTS (
    SELECT 1 FROM event_announced_talent eat
    WHERE eat.event_id = em.event_id AND eat.wrestler_id = mp.wrestler_id
  )
) sub;
```

Note the count. (Expect a non-zero number — this is how many wrestler-profile bug instances we're fixing.)

- [ ] **Step 3: Run the migration**

Paste the contents of `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql` into the SQL editor and run it.

Expected: "Success. No rows returned" with N rows inserted (matching the count from Step 2).

- [ ] **Step 4: Spot-check a fixed wrestler**

Pick any wrestler that was previously only in matches (not announced). Open their public page at `https://www.hottag.app/wrestlers/<slug>`. They should now show the relevant event in their "Upcoming Events" section.

- [ ] **Step 5: Re-run the migration to verify idempotence**

Run the same migration again. Expected: 0 rows affected.

(No commit needed for this task — the SQL file was already committed in Task 4.)

---

### Task 13: End-to-end smoke test

Verifies the full flow works on the live `npm run dev` server before pushing.

- [ ] **Step 1: Pull main, restart dev server, sign in**

Run: `cd src && npm run dev`
Sign in as Dan's promoter account. Navigate to the Promoter Dashboard.

- [ ] **Step 2: Create a fresh test event**

Create a new event (any date in the next few weeks). Set the venue and at least one promotion. Save.

- [ ] **Step 3: Announced Talent picker**

Open Manage Event for the new event.
- The Announced Talent section's picker is always visible at the top.
- "Your Roster" group shows the active roster wrestlers as tiles. None are pre-selected.
- Tap a roster wrestler — added immediately, tile turns orange.
- Tap again — removed.
- Type a non-roster wrestler name in the search field — "More from Hot Tag" group appears.
- Tap a search result — added.
- The existing announced-list rows below still render with sort arrows, photo, name, note input, trash button.

- [ ] **Step 4: Match Card picker — singles match**

Add a new Singles match. Click "+ Add wrestler" (now a dashed button). Picker expands.
- No team toggle row (Singles is not tag-style).
- Tap a wrestler — added to the match. Returns to flat layout (no VS).
- Open Announced Talent — the same wrestler is now in the announced list (auto-sync working).

- [ ] **Step 5: Match Card picker — tag match**

Add a Tag Team match. Click "+ Add wrestler".
- Team toggle row visible: 🔵 Team 1 / 🔴 Team 2.
- Default to Team 1. Tap two wrestlers — they appear in Team 1 (blue badges, VS divider hidden until team 2 has someone).
- Switch to Team 2. Tap two wrestlers — they appear in Team 2 with VS divider visible.
- Tap a Team 1 wrestler while Team 2 is selected — they swap to Team 2 in one tap.
- Tap a Team 2 wrestler while Team 2 is selected — they're removed.

- [ ] **Step 6: Single-picker invariant**

With Match #1's picker open, click "+ Add wrestler" on Match #2.
- Match #1's picker collapses automatically. Only Match #2 is expanded.

- [ ] **Step 7: Cascade-confirm on announced removal**

In Announced Talent, click the trash button on a wrestler that's also in a match.
- A native `confirm()` dialog appears listing the matches.
- Click Cancel — nothing happens.
- Click OK — the wrestler is removed from both announced talent and the match.

- [ ] **Step 8: Match header & layout sanity**

Visual confirmation: the match cards (header badge, title, type, stipulation, edit/delete buttons, participant chips, VS divider) all look identical to before the redesign. Only the bottom "+ Add wrestler" area is different.

- [ ] **Step 9: Wrestler page bug fix verification**

Pick a wrestler you just added to a match (but did not separately add to Announced Talent). Visit their public wrestler page. They should show the test event in their "Upcoming Events" section.

- [ ] **Step 10: Cleanup**

Delete the test event from the dashboard.

- [ ] **Step 11: Final commit (if any drift)**

If the smoke test surfaced minor fixes, commit them with a clear message. Otherwise nothing to do.

- [ ] **Step 12: Push to main**

```bash
git push origin main
```

(Vercel will auto-deploy from main per the project's preferences in CLAUDE.md.)

- [ ] **Step 13: Production smoke check**

Once Vercel deploys, repeat Steps 3-9 once on https://www.hottag.app against a real (non-test) event. Verify nothing in production looks different visually for the existing match cards.

---

## Summary of changes

| File | Type | Tasks |
| --- | --- | --- |
| `src/lib/promoter.ts` | Modified | 1, 2, 3 |
| `database/migration-2026-04-07-backfill-announced-talent-from-matches.sql` | Created | 4, 12 |
| `src/components/EventWrestlerPicker.tsx` | Created | 5, 6 |
| `src/app/dashboard/events/[id]/page.tsx` | Modified | 7 |
| `src/components/DashboardEventSections.tsx` | Modified | 8, 9, 10, 11 |

**Total tasks:** 13
**Total commits:** 11 code commits + 1 SQL run (no commit) + 1 verification (no commit)
