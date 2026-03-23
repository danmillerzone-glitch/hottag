# Past Events Pages Design

## Problem

Past events take up screen real estate on promotion, wrestler, and crew pages while being secondary to upcoming content. Currently, 3 past events are shown inline at 60% opacity with no way to browse the full history. Promotions that run dozens of shows per year have no archive.

## Solution

Replace inline past events on all entity pages with a minimal text link. Create dedicated past events pages at nested routes that display event history as poster card carousels grouped by year.

## Routes

- `/promotions/[slug]/events` — promotion past events
- `/wrestlers/[slug]/events` — wrestler past events
- `/crew/[slug]/events` — crew past events

All three routes are **public** (no auth required). Update `isPublicSlugRoute` in `AuthGate.tsx` to match these nested paths — the current regexes use `$` end anchors that only match the base slug.

## Main Page Changes

### Promotion pages (`/promotions/[slug]/page.tsx`)

Remove the inline past events list (currently lines ~712-743: 3 compact cards at 60% opacity). Replace with a single-line link after the upcoming events section:

```
Past Events (47)  ›
```

- Separated from upcoming events by a `border-top`
- Count is the total number of past events
- Links to `/promotions/[slug]/events`
- Muted text color (`text-foreground-muted`), accent arrow

### Wrestler pages (`/wrestlers/[slug]/page.tsx`)

Same change. Remove inline past events list (~lines 824-842), replace with text link to `/wrestlers/[slug]/events`.

### Crew pages (`/crew/[slug]/page.tsx`)

The crew page currently has no events section. **Add** a "Past Events (count) ›" text link (same style as above) if the crew member has any past events via `event_announced_crew`. Place it after the existing content sections. Only show the link when past event count > 0.

## Dedicated Page Layout

### Header

- Back link: `← [Entity Name]` returning to the main page (e.g., `← RevPro`)
- Page title: "Past Events"
- Subtitle: total event count (e.g., "47 events")
- Entity logo/photo alongside the header (small, 48-52px)

### Body

Events grouped by year, newest year first.

Each year section:
- **Year heading** on the left (e.g., "2026") in accent orange
- **"See All (count) ›"** link on the right
- **Horizontal carousel** of poster cards (3:4 aspect ratio)
  - Swipeable on mobile with scroll-snap (same pattern as existing EventCarousel)
  - Desktop: arrows hidden, scroll with trackpad/mouse
  - Cards link to `/events/[id]`

### "See All" Behavior

Clicking "See All (count) ›" on a year group expands that year inline into a full 3-column grid (responsive: 2 cols on tablet, 1 on mobile). Toggles open/closed. Only one year expanded at a time (expanding a new year collapses the previous).

### Poster Card Content

- Event poster image (`poster_url`) or placeholder gradient with first letter
- Event name (truncated with ellipsis)
- Date (short format: "Mar 1") + City
- `object-top` on poster images (same as existing PosterEventCard)

## Data Queries

### Promotions

```sql
SELECT id, name, event_date, city, state, country, poster_url
FROM events
WHERE promotion_id = [promotion_id]
  AND event_date < today
ORDER BY event_date DESC
```

### Wrestlers

Union of three sources (same pattern as current wrestler page):
- `event_wrestlers` where `wrestler_id` matches
- `match_participants` joined through `event_matches`
- `event_announced_talent` where `wrestler_id` matches

Deduplicate by event ID, return event details.

### Crew

```sql
SELECT events.*
FROM event_announced_crew
JOIN events ON events.id = event_announced_crew.event_id
WHERE event_announced_crew.professional_id = [professional_id]
  AND events.event_date < today
ORDER BY events.event_date DESC
```

### Client-side Grouping

Group the flat results array by year extracted from `event_date`. No server-side pagination — carousels handle overflow per year group.

## Files Modified

1. **`src/app/promotions/[slug]/page.tsx`** — remove inline past events, add text link
2. **`src/app/wrestlers/[slug]/page.tsx`** — remove inline past events, add text link
3. **`src/app/crew/[slug]/page.tsx`** — add past events text link (no existing section to remove)
4. **`src/app/promotions/[slug]/events/page.tsx`** — NEW: promotion past events page
5. **`src/app/wrestlers/[slug]/events/page.tsx`** — NEW: wrestler past events page
6. **`src/app/crew/[slug]/events/page.tsx`** — NEW: crew past events page
7. **`src/components/AuthGate.tsx`** — add new routes to `isPublicSlugRoute`

## Edge Cases

- Entity with zero past events: hide the "Past Events" link entirely on the main page
- Entity with events in only one year: show single year group, no "See All" needed if count is small (< 6)
- Events without poster images: show placeholder card with gradient background and first letter of event name
- Very old events (pre-2020): all years shown, no cutoff

## No Database Changes

All data already exists. No new tables, columns, or migrations needed.
