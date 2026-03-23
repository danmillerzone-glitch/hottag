# Past Events Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline past events on promotion/wrestler/crew pages with a minimal link, and create dedicated past events archive pages with poster card carousels grouped by year.

**Architecture:** Each entity type (promotion, wrestler, crew) gets a new nested route (`/[type]/[slug]/events`) as a server component that fetches past events and passes them to a shared `PastEventsContent` client component. The client component handles year grouping, horizontal carousels with scroll-snap, and "See All" expand/collapse. Main entity pages replace inline past events with a single-line "Past Events (count) ›" link.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase, Tailwind CSS, existing PosterEventCard component

**Spec:** `docs/superpowers/specs/2026-03-23-past-events-pages-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/PastEventsContent.tsx` | CREATE | Client component: header, year grouping, carousels, "See All" toggle |
| `src/app/promotions/[slug]/events/page.tsx` | CREATE | Server component: fetch promotion past events, render PastEventsContent |
| `src/app/wrestlers/[slug]/events/page.tsx` | CREATE | Server component: fetch wrestler past events (3-source union), render PastEventsContent |
| `src/app/crew/[slug]/events/page.tsx` | CREATE | Server component: fetch crew past events, render PastEventsContent |
| `src/components/AuthGate.tsx` | MODIFY | Add 3 new regex patterns to `isPublicSlugRoute` |
| `src/app/promotions/[slug]/page.tsx` | MODIFY | Remove inline past events list, add text link |
| `src/app/wrestlers/[slug]/page.tsx` | MODIFY | Remove inline past events list, add text link |
| `src/app/crew/[slug]/page.tsx` | MODIFY | Add past events count query + text link |

---

### Task 1: Update AuthGate to allow new nested routes

**Files:**
- Modify: `src/components/AuthGate.tsx:23-32`

- [ ] **Step 1: Add new regex patterns to `isPublicSlugRoute`**

In `src/components/AuthGate.tsx`, find the `isPublicSlugRoute` function (lines 23-32). Add three new patterns for the nested `/events` routes. The existing patterns use `$` end anchors that block nested paths.

Add these three lines before the closing `)`:
```typescript
    /^\/promotions\/[^/]+\/events$/.test(path) ||
    /^\/wrestlers\/[^/]+\/events$/.test(path) ||
    /^\/crew\/[^/]+\/events$/.test(path)
```

The full function should look like:
```typescript
function isPublicSlugRoute(path: string): boolean {
  return (
    /^\/wrestlers\/[^/]+$/.test(path) ||
    /^\/promotions\/[^/]+$/.test(path) ||
    /^\/crew\/[^/]+$/.test(path) ||
    /^\/events\/[^/]+$/.test(path) ||
    /^\/venue\/[^/]+$/.test(path) ||
    /^\/location\/[^/]+$/.test(path) ||
    /^\/promotions\/[^/]+\/events$/.test(path) ||
    /^\/wrestlers\/[^/]+\/events$/.test(path) ||
    /^\/crew\/[^/]+\/events$/.test(path)
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AuthGate.tsx
git commit -m "feat: add past events routes to public AuthGate whitelist"
```

---

### Task 2: Create shared PastEventsContent component

**Files:**
- Create: `src/components/PastEventsContent.tsx`

- [ ] **Step 1: Create the PastEventsContent client component**

This component receives pre-fetched past events from server components and handles:
- Header with back link, entity image, title, count
- Year grouping (client-side from `event_date`)
- Horizontal poster card carousel per year (scroll-snap, swipeable)
- "See All (count) ›" toggle that expands a year into a 3-column grid
- Only one year expanded at a time

Create `src/components/PastEventsContent.tsx`:

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PosterEventCard from './PosterEventCard'

interface PastEventsContentProps {
  events: any[]
  entityName: string
  entitySlug: string
  entityType: 'promotions' | 'wrestlers' | 'crew'
  entityImageUrl: string | null
}

function groupByYear(events: any[]): Record<number, any[]> {
  return events.reduce((acc: Record<number, any[]>, event: any) => {
    const year = new Date(event.event_date + 'T12:00:00').getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(event)
    return acc
  }, {})
}

function YearCarousel({ events, year, isExpanded, onToggle }: {
  events: any[]
  year: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-accent">{year}</h2>
        {events.length >= 6 && (
          <button
            onClick={onToggle}
            className="text-sm text-foreground-muted hover:text-accent transition-colors"
          >
            {isExpanded ? 'Collapse' : `See All (${events.length})`} ›
          </button>
        )}
      </div>

      {isExpanded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <PosterEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory"
        >
          {events.map((event: any) => (
            <div key={event.id} className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px] snap-start">
              <PosterEventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PastEventsContent({
  events,
  entityName,
  entitySlug,
  entityType,
  entityImageUrl,
}: PastEventsContentProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const grouped = groupByYear(events)
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  const backPath = entityType === 'promotions'
    ? `/promotions/${entitySlug}`
    : entityType === 'wrestlers'
    ? `/wrestlers/${entitySlug}`
    : `/crew/${entitySlug}`

  const handleToggle = useCallback((year: number) => {
    setExpandedYear(prev => prev === year ? null : year)
  }, [])

  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href={backPath} className="text-sm text-accent hover:underline">
          ← {entityName}
        </Link>
        <h1 className="text-2xl font-display font-bold mt-2">Past Events</h1>
        <p className="text-foreground-muted mt-4">No past events found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {entityImageUrl && (
          <Image
            src={entityImageUrl}
            alt={entityName}
            width={48}
            height={48}
            className="rounded-xl object-contain"
          />
        )}
        <div>
          <Link href={backPath} className="text-sm text-accent hover:underline">
            ← {entityName}
          </Link>
          <h1 className="text-2xl font-display font-bold">Past Events</h1>
          <p className="text-sm text-foreground-muted">{events.length} events</p>
        </div>
      </div>

      {/* Year groups */}
      {years.map(year => (
        <YearCarousel
          key={year}
          events={grouped[year]}
          year={year}
          isExpanded={expandedYear === year}
          onToggle={() => handleToggle(year)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PastEventsContent.tsx
git commit -m "feat: add PastEventsContent shared component for past events pages"
```

---

### Task 3: Create promotion past events page + update main page

**Files:**
- Create: `src/app/promotions/[slug]/events/page.tsx`
- Modify: `src/app/promotions/[slug]/page.tsx:712-743`

- [ ] **Step 1: Create the promotion past events page**

Create `src/app/promotions/[slug]/events/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: promotion } = await supabase
    .from('promotions')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = promotion?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events for ${name}`,
  }
}

export default async function PromotionPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: promotion } = await supabase
    .from('promotions')
    .select('id, name, slug, logo_url')
    .eq('slug', params.slug)
    .single()

  if (!promotion) return notFound()

  const today = getTodayHawaii()
  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)')
    .eq('promotion_id', promotion.id)
    .lt('event_date', today)
    .order('event_date', { ascending: false })

  return (
    <PastEventsContent
      events={events || []}
      entityName={promotion.name}
      entitySlug={promotion.slug}
      entityType="promotions"
      entityImageUrl={promotion.logo_url}
    />
  )
}
```

- [ ] **Step 2: Update promotion main page — replace inline past events with link**

In `src/app/promotions/[slug]/page.tsx`, find the past events section (around lines 712-743). It starts with `{/* Past Events */}` and contains the `pastEvents.slice(0, 3)` rendering.

Replace the entire past events block:

**Remove** (the `{/* Past Events */}` block through its closing `</div>` and `)}`:
```tsx
{/* Past Events */}
{pastEvents.length > 0 && (
  <div>
    <h2 className="text-2xl font-display font-bold mb-6 text-foreground-muted">
      Past Events ({pastEvents.length})
    </h2>
    <div className="space-y-3 opacity-60">
      {pastEvents.slice(0, 3).map((event: any) => (
        ...all the card markup...
      ))}
    </div>
  </div>
)}
```

**Replace with:**
```tsx
{/* Past Events link */}
{pastEvents.length > 0 && (
  <div className="border-t border-border pt-4">
    <Link
      href={`/promotions/${promotion.slug}/events`}
      className="flex items-center justify-between text-foreground-muted hover:text-foreground transition-colors"
    >
      <span>Past Events <span className="opacity-60">({pastEvents.length})</span></span>
      <span className="text-accent">›</span>
    </Link>
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
cd src && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/promotions/[slug]/events/page.tsx src/app/promotions/[slug]/page.tsx
git commit -m "feat: add promotion past events page, replace inline list with link"
```

---

### Task 4: Create wrestler past events page + update main page

**Files:**
- Create: `src/app/wrestlers/[slug]/events/page.tsx`
- Modify: `src/app/wrestlers/[slug]/page.tsx:824-842`

- [ ] **Step 1: Create the wrestler past events page**

The wrestler events query uses a union of 3 sources to find all events a wrestler appeared in. This duplicates the pattern from `src/app/wrestlers/[slug]/page.tsx` lines 41-50, adding `poster_url` to the selects.

Create `src/app/wrestlers/[slug]/events/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const EVENT_FIELDS = 'id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: wrestler } = await supabase
    .from('wrestlers')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = wrestler?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events featuring ${name}`,
  }
}

export default async function WrestlerPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: wrestler } = await supabase
    .from('wrestlers')
    .select('id, name, slug, photo_url')
    .eq('slug', params.slug)
    .single()

  if (!wrestler) return notFound()

  const today = getTodayHawaii()

  // Union of 3 sources (same pattern as wrestlers/[slug]/page.tsx)
  const { data: ewData } = await supabase
    .from('event_wrestlers')
    .select(`events(${EVENT_FIELDS})`)
    .eq('wrestler_id', wrestler.id)

  const { data: mpData } = await supabase
    .from('match_participants')
    .select(`event_matches(events(${EVENT_FIELDS}))`)
    .eq('wrestler_id', wrestler.id)

  const { data: atData } = await supabase
    .from('event_announced_talent')
    .select(`events(${EVENT_FIELDS})`)
    .eq('wrestler_id', wrestler.id)

  const eventMap = new Map<string, any>()
  for (const d of (ewData || [])) {
    const evt = (d as any).events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }
  for (const d of (mpData || [])) {
    const evt = (d as any).event_matches?.events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }
  for (const d of (atData || [])) {
    const evt = (d as any).events
    if (evt && evt.event_date < today) eventMap.set(evt.id, evt)
  }

  const events = Array.from(eventMap.values()).sort(
    (a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )

  return (
    <PastEventsContent
      events={events}
      entityName={wrestler.name}
      entitySlug={wrestler.slug}
      entityType="wrestlers"
      entityImageUrl={wrestler.photo_url}
    />
  )
}
```

- [ ] **Step 2: Update wrestler main page — replace inline past events with link**

In `src/app/wrestlers/[slug]/page.tsx`, find the past events section (around lines 824-842). It starts with `{pastEvents.length > 0 &&` and contains the `pastEvents.slice(0, 3)` rendering.

**Remove** the entire past events block (same structure as promotion page).

**Replace with:**
```tsx
{pastEvents.length > 0 && (
  <div className="border-t border-border pt-4">
    <Link
      href={`/wrestlers/${wrestler.slug}/events`}
      className="flex items-center justify-between text-foreground-muted hover:text-foreground transition-colors"
    >
      <span>Past Events <span className="opacity-60">({pastEvents.length})</span></span>
      <span className="text-accent">›</span>
    </Link>
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
cd src && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/wrestlers/[slug]/events/page.tsx src/app/wrestlers/[slug]/page.tsx
git commit -m "feat: add wrestler past events page, replace inline list with link"
```

---

### Task 5: Create crew past events page + update main page

**Files:**
- Create: `src/app/crew/[slug]/events/page.tsx`
- Modify: `src/app/crew/[slug]/page.tsx`

- [ ] **Step 1: Create the crew past events page**

Create `src/app/crew/[slug]/events/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { getTodayHawaii } from '@/lib/utils'
import PastEventsContent from '@/components/PastEventsContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: professional } = await supabase
    .from('professionals')
    .select('name')
    .eq('slug', params.slug)
    .single()

  const name = professional?.name || params.slug
  return {
    title: `${name} - Past Events | Hot Tag`,
    description: `Browse all past events featuring ${name}`,
  }
}

export default async function CrewPastEventsPage({ params }: { params: { slug: string } }) {
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, slug, photo_url')
    .eq('slug', params.slug)
    .single()

  if (!professional) return notFound()

  const today = getTodayHawaii()
  const { data: announced } = await supabase
    .from('event_announced_crew')
    .select('events(id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url))')
    .eq('professional_id', professional.id)

  const events = (announced || [])
    .map((d: any) => d.events)
    .filter((evt: any) => evt && evt.event_date < today)
    .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  return (
    <PastEventsContent
      events={events}
      entityName={professional.name}
      entitySlug={professional.slug}
      entityType="crew"
      entityImageUrl={professional.photo_url}
    />
  )
}
```

- [ ] **Step 2: Add past events link to crew main page**

The crew page (`src/app/crew/[slug]/page.tsx`) has no existing events section. Add a past events count query and link.

First, add imports at the top of the file (if not already present):
```tsx
import { getTodayHawaii } from '@/lib/utils'
```

In the server component's data fetching section (after the professional data is fetched), add a count query:
```tsx
const today = getTodayHawaii()
const { data: pastEventData } = await supabase
  .from('event_announced_crew')
  .select('events(id, event_date)')
  .eq('professional_id', pro.id)

const pastEventCount = (pastEventData || [])
  .filter((d: any) => d.events && d.events.event_date < today)
  .length
```

Then add the link in the JSX after the "Works With" section (around line 223) and before "Videos":
```tsx
{pastEventCount > 0 && (
  <div className="border-t border-border pt-4">
    <Link
      href={`/crew/${pro.slug}/events`}
      className="flex items-center justify-between text-foreground-muted hover:text-foreground transition-colors"
    >
      <span>Past Events <span className="opacity-60">({pastEventCount})</span></span>
      <span className="text-accent">›</span>
    </Link>
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
cd src && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/crew/[slug]/events/page.tsx src/app/crew/[slug]/page.tsx
git commit -m "feat: add crew past events page with link on crew profiles"
```

---

### Task 6: Final build verification and push

- [ ] **Step 1: Full build**

```bash
cd src && npm run build
```

Expected: Build succeeds. All new routes compile without errors.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

- [ ] **Step 3: Verify on live site after Vercel deploy**

Check these URLs on the live site:
1. Any promotion page (e.g., `/promotions/rev-pro`) — inline past events replaced with text link
2. Click the "Past Events" link — opens `/promotions/rev-pro/events` with year-grouped carousels
3. Any wrestler page — same pattern
4. Any crew page with announced events — link appears
5. Test "See All" expand/collapse on a year with 6+ events
6. Test on mobile — carousels are swipeable
7. Test while logged out — pages should be accessible (AuthGate updated)
