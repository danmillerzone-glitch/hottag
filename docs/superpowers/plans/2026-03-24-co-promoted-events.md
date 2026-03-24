# Co-Promoted Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support multiple promotions per event via an `event_promotions` junction table, with equal ownership, shared dashboard access, and co-promoter display across the site.

**Architecture:** New `event_promotions` junction table replaces the single `events.promotion_id` FK. During transition, both are kept in sync (dual-write). All event queries that filter/join on `promotion_id` switch to the junction table. Display components show all co-promoters with " x " separator.

**Tech Stack:** Supabase (PostgreSQL + RLS), Next.js 14 App Router, TypeScript, Tailwind CSS, Python scraper

**Spec:** `docs/superpowers/specs/2026-03-24-co-promoted-events-design.md`

---

### Task 1: Database Migration — Create `event_promotions` Table

**Files:**
- Create: `database/migrations/event_promotions.sql`

This task creates the junction table, RLS policies, indexes, and backfills from existing data.

- [ ] **Step 1: Write the migration SQL**

Create `database/migrations/event_promotions.sql`:

```sql
-- Co-Promoted Events: junction table for many-to-many events <-> promotions
CREATE TABLE event_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, promotion_id)
);

CREATE INDEX idx_event_promotions_event ON event_promotions(event_id);
CREATE INDEX idx_event_promotions_promotion ON event_promotions(promotion_id);

-- RLS
ALTER TABLE event_promotions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read" ON event_promotions FOR SELECT USING (true);

-- INSERT: user owns the promotion being linked, OR is already a co-promoter on this event
CREATE POLICY "Promoter insert" ON event_promotions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.id = event_promotions.promotion_id
    AND p.claimed_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM event_promotions ep
    JOIN promotions p ON p.id = ep.promotion_id
    WHERE ep.event_id = event_promotions.event_id
    AND p.claimed_by = auth.uid()
  )
);

-- DELETE: user is a co-promoter on this event
CREATE POLICY "Promoter delete" ON event_promotions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM event_promotions ep
    JOIN promotions p ON p.id = ep.promotion_id
    WHERE ep.event_id = event_promotions.event_id
    AND p.claimed_by = auth.uid()
  )
);

-- Backfill from existing events.promotion_id
INSERT INTO event_promotions (event_id, promotion_id)
SELECT id, promotion_id FROM events WHERE promotion_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Run the migration against the Supabase database**

Execute via the Supabase SQL editor or CLI. Verify:
- Table `event_promotions` exists with correct columns
- RLS is enabled with 3 policies (Public read, Promoter insert, Promoter delete)
- Backfill populated rows (count should match `SELECT count(*) FROM events WHERE promotion_id IS NOT NULL`)

- [ ] **Step 3: Commit**

```bash
git add database/migrations/event_promotions.sql
git commit -m "feat: add event_promotions junction table for co-promoted events"
```

---

### Task 2: TypeScript Types & Helper Functions

**Files:**
- Modify: `src/lib/supabase.ts`

Add the `EventPromotion` type and a reusable helper that batch-fetches promotions for a set of event IDs. This helper will be used by many pages to avoid duplicating the batch-fetch pattern.

- [ ] **Step 1: Add EventPromotion interface**

In `src/lib/supabase.ts`, after the `EventWithPromotion` interface (line ~195), add:

```typescript
export interface EventPromotion {
  event_id: string
  promotion_id: string
  promotions: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}
```

- [ ] **Step 2: Add `getEventPromotions` batch helper**

In `src/lib/supabase.ts`, add a new exported function:

```typescript
/**
 * Batch-fetch all promotions for a list of event IDs.
 * Returns a Map from event_id to array of promotions.
 */
export async function getEventPromotions(eventIds: string[]): Promise<Map<string, EventPromotion[]>> {
  if (eventIds.length === 0) return new Map()
  const { data } = await supabase
    .from('event_promotions')
    .select('event_id, promotion_id, promotions(id, name, slug, logo_url)')
    .in('event_id', eventIds)
  const map = new Map<string, EventPromotion[]>()
  for (const ep of (data || []) as EventPromotion[]) {
    if (!map.has(ep.event_id)) map.set(ep.event_id, [])
    map.get(ep.event_id)!.push(ep)
  }
  return map
}
```

- [ ] **Step 3: Add `formatPromotionNames` display helper**

In `src/lib/utils.ts`, add:

```typescript
/**
 * Format multiple promotion names for display.
 * Returns "Promo A" for solo, "Promo A x Promo B" for co-promoted.
 */
export function formatPromotionNames(promotions: { name: string }[]): string {
  return promotions.map(p => p.name).join(' x ')
}
```

- [ ] **Step 4: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/utils.ts
git commit -m "feat: add EventPromotion type and batch helper for co-promoted events"
```

---

### Task 3: Event Detail Page — Query & Display Multiple Promotions

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

The event detail page currently joins `promotions(...)` as a single object. Change it to fetch all co-promoters via `event_promotions` and display them in the "Presented by" section.

- [ ] **Step 1: Add import for `getEventPromotions`**

At the top of `src/app/events/[id]/page.tsx`, add to the existing import from `@/lib/supabase`:

```typescript
import { supabase, getEventPromotions } from '@/lib/supabase'
```

- [ ] **Step 2: Fetch co-promoters after fetching the event**

After the main event fetch query (around line 124), add:

```typescript
// Fetch all co-promoters for this event
const eventPromotionsMap = await getEventPromotions([event.id])
const allPromotions = (eventPromotionsMap.get(event.id) || []).map(ep => ep.promotions)
// Backward compat: use junction data if available, fall back to single FK join
const promotion = allPromotions[0] || event.promotions
```

Replace all references to `event.promotions` with `promotion` (the primary) and use `allPromotions` for display sections that show all co-promoters.

- [ ] **Step 3: Update the "Presented by" section**

Find the "Presented by" section (around line 587). Change it to iterate `allPromotions` instead of showing a single promotion. Each co-promoter gets its own card with logo, name, and link to `/promotions/[slug]`.

The section heading stays "Presented by" regardless of count. If `allPromotions.length === 0`, skip the section entirely (same as current behavior when no promotion).

- [ ] **Step 4: Update the promotion badge at the top of the page**

Find the promotion name badge near the top (around line 289). Replace the single name with all co-promoter names joined by " x ":

```tsx
{allPromotions.length > 0 && (
  <Link href={`/promotions/${allPromotions[0].slug}`} className="...">
    {allPromotions.map(p => p.name).join(' x ')}
  </Link>
)}
```

If there are multiple promotions, the link goes to the first one (since you can't link to multiple). Or make each name a separate link.

- [ ] **Step 5: Update championship badge query for all co-promoters**

Find the championship badge query (around line 137-153). Currently it fetches championships for a single `promotion.id`. Change to fetch for ALL co-promoters so champion badges from any participating promotion appear:

```typescript
// Fetch current championships for ALL co-promoters to show champion badges
let championMap: Record<string, string> = {}
const coPromoterIds = allPromotions.map(p => p.id)
if (coPromoterIds.length > 0) {
  const { data: championships } = await supabase
    .from('promotion_championships')
    .select('name, short_name, current_champion_id, current_champion_2_id')
    .in('promotion_id', coPromoterIds)
    .eq('is_active', true)

  if (championships) {
    for (const c of championships) {
      const label = c.short_name || c.name
      if (c.current_champion_id) championMap[c.current_champion_id] = label
      if (c.current_champion_2_id) championMap[c.current_champion_2_id] = label
    }
  }
}
```

- [ ] **Step 6: Update related events query**

Find the related events query (around line 159, `getPromoEvents`). Change it to fetch events from ALL co-promoters:

```typescript
const coPromoterIds = allPromotions.map(p => p.id)
// Fetch related events from any co-promoter
const { data: relatedEventLinks } = await supabase
  .from('event_promotions')
  .select('event_id')
  .in('promotion_id', coPromoterIds)

const relatedEventIds = [...new Set(
  (relatedEventLinks || []).map(ep => ep.event_id).filter(id => id !== event.id)
)]
// Then fetch those events...
```

- [ ] **Step 7: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds. Visually verify an event detail page looks correct (solo events should look identical to before).

- [ ] **Step 8: Commit**

```bash
git add src/app/events/[id]/page.tsx
git commit -m "feat: event detail page shows all co-promoters"
```

---

### Task 4: Event Cards — Display Co-Promoter Info

**Files:**
- Modify: `src/components/PosterEventCard.tsx`
- Modify: `src/components/EventCard.tsx`

Update both card components to accept and display multiple promotions.

- [ ] **Step 1: Update PosterEventCard**

In `src/components/PosterEventCard.tsx`, the component currently reads `event.promotions` (single object, line 15). Add support for multiple:

```typescript
const PosterEventCard = memo(function PosterEventCard({ event }: PosterEventCardProps) {
  // Support both old single-promotion and new multi-promotion data
  const allPromotions = event.event_promotions
    ? event.event_promotions.map((ep: any) => ep.promotions).filter(Boolean)
    : []
  const promotion = allPromotions[0] || event.promotions
  const coPromoCount = allPromotions.length > 1 ? allPromotions.length - 1 : 0
```

Then update the promotion name display (line 84) to show "+N":

```tsx
<span className="text-xs font-semibold text-white/80 uppercase tracking-wider truncate">
  {promotion.name}
  {coPromoCount > 0 && (
    <span className="text-accent"> +{coPromoCount}</span>
  )}
</span>
```

The background logo fallback (lines 34-44) still uses the first promotion — no change needed.

- [ ] **Step 2: Update EventCard**

In `src/components/EventCard.tsx`, the component reads `event.promotions` (line 113). Add similar logic:

```typescript
export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const allPromotions = event.event_promotions
    ? event.event_promotions.map((ep: any) => ep.promotions).filter(Boolean)
    : []
  const promotion = allPromotions[0] || event.promotions
  const promotionDisplay = allPromotions.length > 1
    ? allPromotions.map((p: any) => p.name).join(' x ')
    : promotion?.name
```

Update each variant's promotion badge (lines 131, 193, 227) to use `promotionDisplay` instead of `promotion.name`. The `badge badge-promotion` class stays the same.

- [ ] **Step 3: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds. Solo events look identical.

- [ ] **Step 4: Commit**

```bash
git add src/components/PosterEventCard.tsx src/components/EventCard.tsx
git commit -m "feat: event cards display co-promoter names"
```

---

### Task 5: Promotion Pages — Query Events via Junction Table

**Files:**
- Modify: `src/app/promotions/[slug]/page.tsx`
- Modify: `src/app/promotions/[slug]/events/page.tsx`

Switch promotion pages from `.eq('promotion_id', id)` to querying through `event_promotions`.

- [ ] **Step 1: Update `getPromotionEvents` in promotion page**

In `src/app/promotions/[slug]/page.tsx`, find `getPromotionEvents` (line 74). Replace:

```typescript
async function getPromotionEvents(promotionId: string) {
  // Query via junction table so co-promoted events appear on all co-promoters' pages
  const { data: links, error } = await supabase
    .from('event_promotions')
    .select('event_id')
    .eq('promotion_id', promotionId)

  if (error || !links || links.length === 0) return []

  const eventIds = links.map(l => l.event_id)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('event_date', { ascending: true })

  return events || []
}
```

- [ ] **Step 2: Update past events page**

In `src/app/promotions/[slug]/events/page.tsx`, the query at line 31-36 uses `.eq('promotion_id', promotion.id)`. Replace:

```typescript
const today = getTodayHawaii()

// Get event IDs via junction table
const { data: links } = await supabase
  .from('event_promotions')
  .select('event_id')
  .eq('promotion_id', promotion.id)

const eventIds = (links || []).map(l => l.event_id)
const { data: events } = eventIds.length > 0
  ? await supabase
      .from('events')
      .select('id, name, event_date, city, state, country, poster_url, promotions(name, slug, logo_url)')
      .in('id', eventIds)
      .lt('event_date', today)
      .order('event_date', { ascending: false })
  : { data: [] }
```

- [ ] **Step 3: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds. Promotion pages still show their events correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/promotions/[slug]/page.tsx src/app/promotions/[slug]/events/page.tsx
git commit -m "feat: promotion pages query events via junction table"
```

---

### Task 6: Events Browse Page — Batch-Load Co-Promoters

**Files:**
- Modify: `src/app/events/page.tsx`

The events browse page fetches events with `promotions(...)` as a single join. Add a batch-fetch of co-promoters and attach them to each event.

- [ ] **Step 1: Add import**

```typescript
import { getEventPromotions } from '@/lib/supabase'
```

- [ ] **Step 2: After fetching events, batch-load co-promoters**

After the main event query, add:

```typescript
// Batch-fetch all co-promoters for displayed events
const eventIds = events.map((e: any) => e.id)
const eventPromotionsMap = await getEventPromotions(eventIds)

// Attach co-promoter data to each event
const eventsWithPromotions = events.map((e: any) => ({
  ...e,
  event_promotions: eventPromotionsMap.get(e.id) || [],
}))
```

Pass `eventsWithPromotions` to the rendering instead of `events`.

- [ ] **Step 3: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/events/page.tsx
git commit -m "feat: events browse page loads co-promoter data"
```

---

### Task 7: Dashboard — Event Listing & Authorization

**Files:**
- Modify: `src/lib/promoter.ts`
- Modify: `src/app/dashboard/events/[id]/page.tsx`

Switch the promoter dashboard to query events via the junction table and update the authorization check.

- [ ] **Step 1: Update `getPromoterDashboard` event queries**

In `src/lib/promoter.ts`, find the upcoming events query (line 224) and past events query (line 232). Both use `.eq('promotion_id', promotion.id)`. Replace each with a two-step query through `event_promotions`:

```typescript
// Fetch event IDs for this promotion via junction table
const { data: eventLinks } = await supabase
  .from('event_promotions')
  .select('event_id')
  .eq('promotion_id', promotion.id)

const eventIds = (eventLinks || []).map(l => l.event_id)

// Fetch upcoming events
const { data: upcoming } = eventIds.length > 0
  ? await supabase
      .from('events')
      .select('*, event_streaming_links(id)')
      .in('id', eventIds)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
  : { data: [] }

// Fetch past events (last 3)
const { data: past } = eventIds.length > 0
  ? await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .lt('event_date', today)
      .order('event_date', { ascending: false })
      .limit(3)
  : { data: [] }
```

- [ ] **Step 2: Update total attending query**

The total attending query (line 247-252) uses `.eq('events.promotion_id', promotion.id)`. Replace with a junction-based approach:

```typescript
// Total attending across upcoming events for this promotion
let totalAttending = 0
if (eventIds.length > 0) {
  const upcomingIds = (upcoming || []).map((e: any) => e.id)
  if (upcomingIds.length > 0) {
    const { count } = await supabase
      .from('user_event_attendance')
      .select('*', { count: 'exact', head: true })
      .in('event_id', upcomingIds)
      .eq('status', 'attending')
    totalAttending = count || 0
  }
}
```

- [ ] **Step 3: Add dual-write to `createEvent` in promoter.ts**

In `src/lib/promoter.ts`, find `createEvent` (line 775). After the event insert (line 810-821) and before `return event`, add the junction table insert:

```typescript
// Dual-write to event_promotions junction table
if (event?.id && data.promotion_id) {
  await supabase
    .from('event_promotions')
    .insert({ event_id: event.id, promotion_id: data.promotion_id })
}
```

This works because `createEvent` uses the client Supabase with the user's session, and the RLS INSERT policy allows users who own the promotion being linked.

- [ ] **Step 4: Update `getEventForEditing` to include co-promoters**

In `src/lib/promoter.ts`, find `getEventForEditing`. After fetching the event, also fetch its co-promoters:

```typescript
// Fetch co-promoters
const { data: eventPromos } = await supabase
  .from('event_promotions')
  .select('promotion_id, promotions(id, name, slug, logo_url, claimed_by)')
  .eq('event_id', eventId)

return { ...data, event_promotions: eventPromos || [] }
```

- [ ] **Step 5: Update dashboard auth check**

In `src/app/dashboard/events/[id]/page.tsx`, the auth check at line 46 is:
```typescript
if (data.promotions?.claimed_by !== user?.id) {
```

Replace with a check against all co-promoters:

```typescript
const isCoPromoter = data.event_promotions?.some(
  (ep: any) => ep.promotions?.claimed_by === user?.id
)
if (!isCoPromoter) {
  // Fall through to existing promotion_admins check
```

This preserves the existing `promotion_admins` fallback check.

- [ ] **Step 6: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds. Dashboard still shows events for the promoter.

- [ ] **Step 7: Commit**

```bash
git add src/lib/promoter.ts src/app/dashboard/events/[id]/page.tsx
git commit -m "feat: dashboard queries events via junction table, updated auth"
```

---

### Task 8: Dashboard — Co-Promoter Management UI

**Files:**
- Modify: `src/app/dashboard/events/[id]/page.tsx`

Add a "Co-Promoters" section to the event edit page where promoters can add/remove co-promoters.

- [ ] **Step 1: Add co-promoter state and fetch**

In the `ManageEventPage` component, add state:

```typescript
const [coPromotions, setCoPromotions] = useState<any[]>([])
const [promoSearch, setPromoSearch] = useState('')
const [promoResults, setPromoResults] = useState<any[]>([])
```

In `loadEvent`, after setting the event, populate `coPromotions` from `data.event_promotions`.

- [ ] **Step 2: Add promotion search function**

```typescript
const searchPromotions = async (query: string) => {
  if (query.length < 2) { setPromoResults([]); return }
  const supabase = (await import('@/lib/supabase-browser')).createClient()
  const { data } = await supabase
    .from('promotions')
    .select('id, name, slug, logo_url')
    .ilike('name', `%${query}%`)
    .limit(5)
  // Filter out already-linked promotions
  const existingIds = new Set(coPromotions.map(ep => ep.promotion_id))
  setPromoResults((data || []).filter(p => !existingIds.has(p.id)))
}
```

- [ ] **Step 3: Add/remove co-promoter functions**

```typescript
const addCoPromoter = async (promotionId: string) => {
  const supabase = (await import('@/lib/supabase-browser')).createClient()
  const { error } = await supabase
    .from('event_promotions')
    .insert({ event_id: eventId, promotion_id: promotionId })
  if (!error) {
    await loadEvent() // Refresh
    setPromoSearch('')
    setPromoResults([])
  }
}

const removeCoPromoter = async (promotionId: string) => {
  if (coPromotions.length <= 1) return // Can't remove the last one
  const supabase = (await import('@/lib/supabase-browser')).createClient()
  await supabase
    .from('event_promotions')
    .delete()
    .eq('event_id', eventId)
    .eq('promotion_id', promotionId)
  await loadEvent()
}
```

- [ ] **Step 4: Add Co-Promoters UI section**

Add a new section in the event management page (after the main event info sections):

```tsx
{/* Co-Promoters */}
<div className="card p-6">
  <h2 className="text-lg font-bold mb-4">Co-Promoters</h2>
  <p className="text-sm text-foreground-muted mb-4">
    Add other promotions co-hosting this event. All co-promoters get equal dashboard access.
  </p>

  {/* Current co-promoters as chips */}
  <div className="flex flex-wrap gap-2 mb-4">
    {coPromotions.map((ep: any) => (
      <div key={ep.promotion_id} className="flex items-center gap-2 bg-background-tertiary rounded-lg px-3 py-2">
        {ep.promotions?.logo_url && (
          <Image src={ep.promotions.logo_url} alt="" width={20} height={20} className="rounded-sm object-contain" />
        )}
        <span className="text-sm font-medium">{ep.promotions?.name}</span>
        {coPromotions.length > 1 && (
          <button onClick={() => removeCoPromoter(ep.promotion_id)} className="text-foreground-muted hover:text-red-400 ml-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}
  </div>

  {/* Search to add */}
  <div className="relative">
    <input
      type="text"
      value={promoSearch}
      onChange={(e) => { setPromoSearch(e.target.value); searchPromotions(e.target.value) }}
      placeholder="Search promotions to add..."
      className="input w-full"
    />
    {promoResults.length > 0 && (
      <div className="absolute z-10 mt-1 w-full bg-background-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {promoResults.map(p => (
          <button key={p.id} onClick={() => addCoPromoter(p.id)}
            className="w-full text-left px-4 py-2 hover:bg-background-tertiary flex items-center gap-2">
            {p.logo_url && <Image src={p.logo_url} alt="" width={20} height={20} className="rounded-sm object-contain" />}
            <span className="text-sm">{p.name}</span>
          </button>
        ))}
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 5: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/events/[id]/page.tsx
git commit -m "feat: co-promoter management UI in promoter dashboard"
```

---

### Task 9: Admin Panel — Multi-Promotion Event Editor

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/lib/admin.ts`

Add co-promoter management to the admin event editor. Similar to the dashboard UI but using admin-level access.

- [ ] **Step 1: Add `event_promotions` to `ALLOWED_TABLES` in admin API route**

In `src/app/api/admin/route.ts`, add `'event_promotions'` to the `ALLOWED_TABLES` set (line 35-49). This lets the admin service-role client insert/delete junction table rows:

```typescript
const ALLOWED_TABLES = new Set([
  'events',
  'event_promotions',  // Add this line
  // ... rest stays the same
])
```

- [ ] **Step 2: Update `createEventAdmin` to return the event ID and dual-write**

In `src/lib/admin.ts`, find `createEventAdmin` (line 669). The function currently calls `await adminApi(...)` without returning the result. The admin API's `insert` action already returns `{ success: true, data: result }` with `.select().single()`. Change the function to:

```typescript
// At the end of createEventAdmin, replace the last line:
const result = await adminApi({ action: 'insert', table: 'events', data: insertData })

// Dual-write to event_promotions junction table
if (result?.data?.id && eventData.promotion_id) {
  await adminApi({
    action: 'insert',
    table: 'event_promotions',
    data: { event_id: result.data.id, promotion_id: eventData.promotion_id }
  })
}

return result?.data
```

Note: The admin dual-write uses `adminApi` (service role) because the admin user may not own the promotion, so client-side RLS would block the insert.

- [ ] **Step 3: Add admin co-promoter functions**

In `src/lib/admin.ts`, add. Note: these use `adminApi` (service role) for insert/delete since admins may not own promotions:

```typescript
export async function getEventCoPromotions(eventId: string) {
  const supabase = (await import('@/lib/supabase-browser')).createClient()
  const { data } = await supabase
    .from('event_promotions')
    .select('promotion_id, promotions(id, name, slug, logo_url)')
    .eq('event_id', eventId)
  return data || []
}

export async function addEventCoPromotion(eventId: string, promotionId: string) {
  return adminApi({ action: 'insert', table: 'event_promotions', data: { event_id: eventId, promotion_id: promotionId } })
}

export async function removeEventCoPromotion(eventId: string, promotionId: string) {
  // Use client Supabase for delete — admin may need service role
  // Actually, use adminApi with a filter approach
  const supabase = (await import('@/lib/supabase-browser')).createClient()
  return supabase.from('event_promotions').delete().eq('event_id', eventId).eq('promotion_id', promotionId)
}
```

Note: `addEventCoPromotion` uses `adminApi` (service role) since admin users don't own promotions and RLS would block the insert. `removeEventCoPromotion` uses client Supabase — if this hits RLS issues, switch to a custom admin API endpoint. Alternatively, both can use `adminApi` if `event_promotions` is in `ALLOWED_TABLES` (added in Step 1). For delete via `adminApi`, use the `delete` action with a filter: `adminApi({ action: 'delete', table: 'event_promotions', filter: { event_id: eventId, promotion_id: promotionId } })` — but the current admin API delete only supports `.eq('id', id)`, not composite keys. **Simplest fix:** Use `adminApi` insert for adds, and for deletes, first query the `event_promotions` row ID then delete by ID.

- [ ] **Step 4: Add co-promoter UI in admin Events tab**

In `src/app/admin/page.tsx`, in the event editing section of the Events tab, add a co-promoter management section similar to Task 8's UI. Use the admin functions from Step 3.

- [ ] **Step 5: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin.ts src/app/admin/page.tsx src/app/api/admin/route.ts
git commit -m "feat: admin panel supports co-promoter management"
```

---

### Task 10: Remaining Pages — Map, Search, Location, Venue, etc.

**Files:**
- Modify: `src/app/map/page.tsx`
- Modify: `src/app/search/page.tsx`
- Modify: `src/app/location/[location]/page.tsx`
- Modify: `src/app/venue/[venue]/page.tsx`
- Modify: `src/app/vegas-weekend/page.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/components/NearYouSection.tsx`
- Modify: `src/components/RecommendedSection.tsx`
- Modify: `src/components/ThisWeekendSection.tsx`
- Modify: `src/app/wrestlers/[slug]/page.tsx`
- Modify: `src/app/wrestlers/[slug]/events/page.tsx`
- Modify: `src/app/crew/[slug]/events/page.tsx`
- Modify: `src/components/PromoterAnalytics.tsx`

These pages all display event promotion info via the old `promotions(...)` FK join. For each:

1. After fetching events, batch-load co-promoters using `getEventPromotions(eventIds)`
2. Attach `event_promotions` to each event object
3. Display components (EventCard, PosterEventCard) already handle the new data from Task 4

The pattern is the same everywhere — add the batch-fetch after the event query and merge the results.

- [ ] **Step 1: Update map page**

In `src/app/map/page.tsx`, after fetching events, add the batch-fetch. The map popup text should show all co-promoter names joined with " x ".

- [ ] **Step 2: Update search page**

In `src/app/search/page.tsx`, update the event search results to include co-promoter names in the subtitle.

- [ ] **Step 3: Update location page**

In `src/app/location/[location]/page.tsx`, batch-fetch co-promoters after loading events.

- [ ] **Step 4: Update venue page**

In `src/app/venue/[venue]/page.tsx`, batch-fetch co-promoters after loading events.

- [ ] **Step 5: Update homepage sections**

In `src/components/NearYouSection.tsx`, `RecommendedSection.tsx`, and `ThisWeekendSection.tsx`, batch-fetch co-promoters for displayed events.

- [ ] **Step 6: Update Vegas Weekend, profile, wrestler/crew pages**

Same pattern for remaining pages. These all use PosterEventCard or EventCard which already handle the new data.

- [ ] **Step 7: Update PromoterAnalytics**

In `src/components/PromoterAnalytics.tsx`, update event queries to use the junction table.

- [ ] **Step 8: Build and verify**

Run: `cd src && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/map/page.tsx src/app/search/page.tsx src/app/location/[location]/page.tsx \
  src/app/venue/[venue]/page.tsx src/app/vegas-weekend/page.tsx src/app/profile/page.tsx \
  src/components/NearYouSection.tsx src/components/RecommendedSection.tsx \
  src/components/ThisWeekendSection.tsx src/app/wrestlers/[slug]/page.tsx \
  src/app/wrestlers/[slug]/events/page.tsx src/app/crew/[slug]/events/page.tsx \
  src/components/PromoterAnalytics.tsx
git commit -m "feat: all pages load co-promoter data for events"
```

---

### Task 11: Scraper — Parse Co-Promoted Events from Cagematch

**Files:**
- Modify: `scripts/hottag_sync.py`

Update the Python scraper to detect co-promoted events from Cagematch's comma-separated "Promotion" field and write to both `events.promotion_id` and `event_promotions`.

- [ ] **Step 1: Update promotion parsing**

Find where the scraper parses the promotion name from Cagematch. Currently it looks up a single promotion. Change to split on commas:

```python
def get_promotion_ids(promotion_text):
    """Parse comma-separated promotion names, return list of promotion IDs."""
    names = [name.strip() for name in promotion_text.split(',')]
    promotion_ids = []
    for name in names:
        # Look up promotion by name (existing logic)
        promo = lookup_promotion(name)
        if promo:
            promotion_ids.append(promo['id'])
    return promotion_ids
```

- [ ] **Step 2: Update event insertion to write to junction table**

After inserting/updating the event, insert rows into `event_promotions`:

```python
def create_event_promotions(event_id, promotion_ids):
    """Insert event_promotions rows for all co-promoters."""
    for promo_id in promotion_ids:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/event_promotions",
            json={'event_id': event_id, 'promotion_id': promo_id},
            headers={**DB_HEADERS, 'Prefer': 'resolution=ignore-duplicates'}
        )
```

- [ ] **Step 3: Dual-write `events.promotion_id`**

Set `events.promotion_id` to the first matched promotion for backward compatibility:

```python
event_data['promotion_id'] = promotion_ids[0] if promotion_ids else None
```

- [ ] **Step 4: Test with a known co-promoted event**

Run the scraper for a known co-promoted event (e.g., the Borracho Pro / New Texas Pro / United210 event) and verify:
- `events.promotion_id` is set to the first promotion
- `event_promotions` has 3 rows for this event
- The event appears on all 3 promotion pages

- [ ] **Step 5: Commit**

```bash
git add scripts/hottag_sync.py
git commit -m "feat: scraper detects co-promoted events from Cagematch"
```

---

### Task 12: Build Verification & Push

- [ ] **Step 1: Full build**

Run: `cd src && npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 2: Push to deploy**

```bash
git push origin main
```

- [ ] **Step 3: Visual verification on live site**

After Vercel deploys, verify:
- Solo events look identical (no visual change)
- Promotion pages still show all their events
- Event detail pages show "Presented by" correctly
- Dashboard still lists events for the promoter
- Admin panel works

If a co-promoted event exists in the DB (from scraper or manual admin), also verify:
- Event detail shows all co-promoter logos/names
- Event appears on all co-promoters' promotion pages
- Event cards show "+N" or " x " display
- Dashboard auth works for both co-promoters
