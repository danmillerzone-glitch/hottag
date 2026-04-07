# Event Card Builder Redesign

**Date:** 2026-04-06
**Status:** Approved

## Problem

Promoters report that putting together a card and adding announced talent to events is slow and tedious. The pain points:

1. **No roster reuse** — Every event starts from a blank `WrestlerSearchBox`. Promoters with a regular roster of 15-25 wrestlers must search and add each one individually, even though they book the same people every show.
2. **Bulk add/remove is missing** — Adding 10+ wrestlers takes 10+ search-and-click cycles. Removing them is one-by-one as well.
3. **Match-builder friction** — Building a match is a multi-step process: create the empty match, click "Add wrestler" inside it, search, add, switch the team dropdown for tag matches, repeat.
4. **Wrestlers in matches do not appear on their own profiles.** A wrestler's "Upcoming Events" section on their public page is populated only from `event_announced_talent`. Wrestlers added to a match (`match_participants`) without also being added to announced talent are silently invisible on their wrestler page. This is a real, current bug — not just a UX issue.

The card information itself almost always lives in the booker's notes or head — promoters sit down and type it in. There is no upstream system to import from. The fix has to make typing-in faster, not replace it.

## Solution

Three coordinated changes built around a single new shared UI component:

1. **A new `EventWrestlerPicker` component** with an always-visible search field and an auto-loaded "Your Roster" grid below it. Tap-to-toggle. Used in both the Announced Talent section and inside each Match.
2. **A data invariant: every wrestler in a match must also have an `event_announced_talent` row for that event.** Adding to a match now also adds to announced talent. This makes the picker the same conceptual object in both places and (incidentally) fixes the wrestler-profile bug without changing any read queries.
3. **A one-time backfill** that creates `event_announced_talent` rows for all existing match participants, fixing historical data.

## Goals

- Cut the number of clicks/taps to add a regular roster member to an event from "search → click result" to "tap once."
- Make removal as fast as addition (tap an added tile to remove).
- Make the same picker work for both Announced Talent and Match participants.
- Fix the bug where match-only wrestlers do not show on their own wrestler page.
- Keep the existing announced talent display (sort arrows, notes, trash button) and the existing match display (chips, VS divider, edit) unchanged — this is a "how do you add wrestlers" redesign, not a full visual overhaul of the dashboard.

## Non-goals

- **No paste-from-text or OCR/image parsing.** Out of scope for this spec; promoters work from notes/heads.
- **No drag-and-drop reordering of tiles.** The existing up/down arrows in the announced list stay.
- **No multi-select / bulk-action toolbar.** Tap-to-toggle handles this organically.
- **No changes to the Linked Card section, Announced Crew section, or other dashboard sections.** Out of scope.
- **No changes to the wrestler page upcoming-events query.** The data invariant fix removes the need.
- **No "auto-add to roster on first booking" suggestion.** Roster management stays in the existing roster dashboard.

---

## 1. The `EventWrestlerPicker` component

**File:** `src/components/EventWrestlerPicker.tsx` (new)

A self-contained, reusable picker panel. The single source of "how to find and toggle a wrestler" used by both Announced Talent and Match Card sections.

### Layout

- **Search field** at the top, always visible. Placeholder: `"Search any wrestler in Hot Tag..."` Searches across the entire wrestlers table when the user types 2+ characters (300ms debounce — same as existing `WrestlerSearchBox`).
- **Optional Team toggle row** above the search (only when `mode === 'match'` and the parent match is a tag/multi-team type). Shows `"NEXT TAP →"` followed by `🔵 Team 1 / 🔴 Team 2` buttons. Sticky selection so the user can rapidly add multiple wrestlers to one team.
- **"Your Roster" group** below the search, auto-loaded on mount. Group label: `"Your Roster · N active"`. Tile grid using `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))` so it reflows to ~2 columns on mobile and ~5-6 on desktop.
- **"More from Hot Tag" group**, only shown when the user has typed in the search field. Same tile layout.

### Tiles

Each tile is a tap-to-toggle button:

- **Photo** (24-26px square, rounded). If the wrestler has no `photo_url`, fall back to a colored square with their initials.
- **Name** (single line, ellipsis on overflow).
- **Visual state** depends on whether the wrestler is currently associated with the event and which mode the picker is in:
  - **Announced Talent mode (`mode === 'announced'`)**: tile is either neutral (gray, "+" icon over photo) or `added` (orange-tinted background, ✓ icon).
  - **Match mode (`mode === 'match'`)**:
    - Neutral if not in this match.
    - `team1` (blue-tinted) if in this match on team 1.
    - `team2` (red-tinted) if in this match on team 2.
    - For non-team match types (singles, battle royal), use the `added` (orange) state instead of team colors.

### Tap behavior

**Announced Talent mode:**
- Neutral tile → call `onAdd(wrestlerId)`.
- Added tile → call `onRemove(wrestlerId)`. (No confirmation here — see "Cascade-confirm" section below for the case where this needs to surface a dialog. The dialog is owned by the consumer, not the picker.)

**Match mode:**
- Neutral tile → call `onAdd(wrestlerId, selectedTeam)`. The wrestler is added to the currently-selected team (or as a flat participant for non-team matches).
- Same-team tile → call `onRemove(wrestlerId)`.
- Other-team tile → call `onSwap(wrestlerId, selectedTeam)`. The wrestler moves to the selected team. This is one tap, not two.

### Props

```ts
type EventWrestlerPickerProps = {
  rosterWrestlers: RosterWrestler[]   // pre-fetched by parent (for promotion(s) of the event)
  selectedIds: string[]               // wrestlers currently in the parent context
  mode: 'announced' | 'match'
  matchTeams?: { wrestlerId: string; team: 1 | 2 }[]  // only when mode === 'match' and tag-style
  showTeamToggle?: boolean            // true when this is a tag-style match
  onAdd: (wrestlerId: string, team?: 1 | 2) => void
  onRemove: (wrestlerId: string) => void
  onSwap?: (wrestlerId: string, toTeam: 1 | 2) => void
}
```

The picker is a controlled component — it does no data mutation itself. All persistence happens in the consumer (`AnnouncedTalentSection` or `MatchItem`), which calls back into `src/lib/promoter.ts`.

### Roster source

The "Your Roster" list is populated from `wrestler_promotions` joined to `wrestlers`, filtered to `is_active = true`, for **every** promotion linked to the event via `event_promotions`. For multi-promotion (co-promoted) events, the roster is the **union** of all co-promoters' active rosters. Deduplicated by wrestler ID. Sorted alphabetically by name (matches how rosters are displayed elsewhere in the app).

The fetch happens once when the parent (`ManageEventPage`) loads and is passed down via props. No refetching on each picker mount.

### Empty roster state

If `rosterWrestlers.length === 0`, the "Your Roster" group is not rendered at all — replaced with a small inline message: `"No active roster yet. Manage your roster →"` (linking to the promotion's roster dashboard). The search field remains fully functional. The picker still works for promotions that book purely one-off talent.

---

## 2. Announced Talent integration

**File:** `src/components/DashboardEventSections.tsx`, `AnnouncedTalentSection`

**Changes:**

- Remove the `[+ Add Talent]` button and the `showSearch` toggle state.
- Mount `EventWrestlerPicker` directly inside the section, **above** the existing announced list. The picker is always visible — there is no expand/collapse.
- `mode='announced'`. `selectedIds` = the IDs of all currently-announced wrestlers for this event.
- `onAdd(wrestlerId)` calls `addAnnouncedTalent({ event_id, wrestler_id, sort_order: talent.length })` (existing function in `promoter.ts`).
- `onRemove(wrestlerId)` does the **cascade-confirm check** described in section 4 below.

The existing announced list below the picker (`talent.map(...)` rendering rows with sort arrows, notes input, trash button) is unchanged. It's the persistent "managed view" of what the picker has produced.

---

## 3. Match Card integration

**File:** `src/components/DashboardEventSections.tsx`, `MatchItem`

**Changes:**

- Remove the inline `WrestlerSearchBox` and the `showAddWrestler` toggle.
- Replace the `[+ Add wrestler]` link with a styled `[+ Add wrestler]` button (dashed border, accent text — see mockup).
- When clicked, the picker opens **inside that match item** (not as a modal). Only one picker is open at a time across all matches: clicking another match's button collapses any other open picker first. This is a per-`MatchCardSection` state, not a global one.
- The picker uses `mode='match'`. `selectedIds` = the participant wrestler IDs in this match. `matchTeams` = the team mapping. `showTeamToggle = true` for `match_type` in `['Tag Team', '6-Man Tag', '8-Man Tag']`.
- `onAdd(wrestlerId, team)` calls `addMatchParticipant({ match_id, wrestler_id, team_number: team ?? 1 })` (modified — see section 4).
- `onRemove(wrestlerId)` calls `removeMatchParticipant(participantId)`. Removing from a match never affects announced talent (the wrestler is still announced for the event).
- `onSwap(wrestlerId, toTeam)` is a new operation — implemented as `update match_participants set team_number = toTeam where match_id = ? and wrestler_id = ?`.

The existing match header (number badge, title, type, stipulation, edit/delete buttons) and the participant chip display (with VS divider for team matches) are unchanged.

---

## 4. The Match → Announced Talent invariant

**Rule:** For every event, every wrestler in `match_participants` (via any of that event's matches) must also have a row in `event_announced_talent` for that event.

This invariant is maintained at the application layer (in `src/lib/promoter.ts`) rather than via a database trigger. We are not enforcing it as a database constraint — only as application behavior.

### Add path

**File:** `src/lib/promoter.ts`, `addMatchParticipant`

After the existing insert into `match_participants`, look up the wrestler's event via the match's `event_id` and call:

```ts
// Idempotent insert into event_announced_talent.
// Use Postgres ON CONFLICT DO NOTHING (or .upsert with onConflict)
// keyed on (event_id, wrestler_id) so this is a no-op if the wrestler
// is already announced.
```

The combination `(event_id, wrestler_id)` already has a unique constraint on `event_announced_talent` — the existing code catches `23505` errors silently when the user tries to manually add a duplicate. We'll use `.upsert(..., { onConflict: 'event_id,wrestler_id', ignoreDuplicates: true })` instead so the insert succeeds-or-noops in one round trip.

`addMatchParticipant` becomes a two-step operation. If the second step fails, log the error but do not roll back the first — the participant insert is the user's primary intent and they can be added to announced talent on a subsequent action. (We are explicitly trading strict consistency for simpler error recovery; the backfill script runs after each deploy as a safety net if needed.)

### Remove path (from match)

`removeMatchParticipant` is unchanged. Removing a wrestler from a match does **not** remove them from announced talent. The wrestler is still announced for the event — they're just no longer in this specific match.

### Remove path (from announced talent — cascade-confirm)

**File:** `src/lib/promoter.ts`, new function `getMatchParticipationForWrestler(eventId, wrestlerId)` returning `{ matchId, matchTitle, matchOrder }[]`.

**Caller:** `AnnouncedTalentSection`, in the `onRemove` handler.

Flow:
1. Before calling `removeAnnouncedTalent`, call `getMatchParticipationForWrestler(eventId, wrestlerId)`.
2. If the result is empty, proceed immediately with `removeAnnouncedTalent`.
3. If the result is non-empty, show a confirm dialog:
   - **Title:** `"{Wrestler name} is in a match"`
   - **Body:** `"This wrestler is currently in {match label list}. Removing them from Announced Talent will also remove them from the match."`
   - **Buttons:** `Cancel` (gray) and `Remove from both` (red).
   - The match label is `"Match #{order}: {title || 'Match N'}"`. If they're in multiple matches, list each on its own line in the body.
4. On confirm: delete all `match_participants` rows for this wrestler in this event's matches, then call `removeAnnouncedTalent(talentId)`.
5. On cancel: do nothing.

The confirm dialog is a small reusable React component (or an inline `confirm()` for v1 — see Open Questions). We do not need a global modal system; a section-local confirm is fine.

---

## 5. One-time data migration (backfill)

**File:** `database/migrations/2026-04-06-backfill-announced-talent-from-matches.sql`

```sql
-- Backfill: ensure every wrestler in any match has an
-- event_announced_talent row for that match's event.
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

Run once via Supabase SQL editor as part of the deploy. The query is idempotent (the `NOT EXISTS` filter makes re-runs no-ops). After running, every match participant in the database has a corresponding announced talent record, and the wrestler-profile bug is retroactively fixed.

The `sort_order` calculation uses a per-event running max so the backfilled rows append to the end of any existing announced list rather than colliding. (Sort order on `event_announced_talent` is not unique-constrained, so collisions wouldn't error — but appending is the friendlier display.)

---

## 6. Files affected

| File | Type | Change |
| --- | --- | --- |
| `src/components/EventWrestlerPicker.tsx` | new | The shared picker component. |
| `src/components/DashboardEventSections.tsx` | modified | `AnnouncedTalentSection` and `MatchItem` use the new picker. Remove the inline `WrestlerSearchBox`. Add cascade-confirm flow. |
| `src/lib/promoter.ts` | modified | `addMatchParticipant` upserts an announced talent row. New `getMatchParticipationForWrestler`. New `swapMatchParticipantTeam` (or extend existing update path). |
| `src/app/dashboard/events/[id]/page.tsx` | modified | Pre-fetch `rosterWrestlers` from the union of co-promoter rosters and pass it down to the section components. |
| `database/migrations/2026-04-06-backfill-announced-talent-from-matches.sql` | new | One-time backfill SQL. |

Files **not** changed:
- The wrestler page query (`src/app/wrestlers/[slug]/page.tsx` and friends) — the bug fix happens via the data invariant, not a query change.
- `LinkedWrestlersSection`, `AnnouncedCrewSection` — out of scope.
- `MatchCardSection` outer shell — only `MatchItem` (the per-match component) changes.
- `WrestlerSearchBox` — deleted entirely; nothing else uses it.

---

## 7. Open questions

These are minor and can be settled during implementation rather than gating the spec:

1. **Confirm dialog component.** Use the browser's `window.confirm()` for v1 to ship faster, or build a small styled `<ConfirmDialog>` component? The mockup shows a styled dialog. Recommendation: ship `window.confirm()` for v1, file a follow-up to upgrade to a styled dialog if Dan finds the native dialog jarring.
2. **Picker scroll behavior on long rosters.** For promotions with 50+ active roster wrestlers, should the grid have a `max-height` with internal scroll, or just let the page grow? Recommendation: no max-height for v1 — the search field handles overflow naturally and most promo rosters are under 30. Revisit if a problem emerges.

## 8. Resolved decisions (audit trail from brainstorming)

- **Layout** — Always-visible inline picker (not modal, not side panel). Search field is the primary control. Roster grid auto-loads with nothing pre-selected.
- **Scope** — Picker is reused in both Announced Talent and Match Card sections (not just one).
- **Tile content** — Small wrestler photo (24-26px) plus name. `minmax(140px, 1fr)` reflow grid.
- **Removal from announced talent when wrestler is in a match** — Cascade with confirmation dialog (not strict-block, not silent allow).
- **Match → announced sync direction** — One-way. Adding to a match adds to announced talent. Removing from a match does NOT remove from announced talent.
- **Wrestler upcoming events bug fix** — Solved via the invariant + backfill, not via a query change.
- **Search threshold** — Keep existing 2-character minimum + 300ms debounce.
- **Empty roster** — Hide the "Your Roster" group, show a small "No active roster yet" message, leave the search field functional.
