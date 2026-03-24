# Co-Promoted Events Design Spec

## Goal

Allow multiple promotions to be listed on a single event, supporting co-promoted shows like Fantastica Mania (Rev Pro x CMLL) or multi-promotion events (Borracho Pro, New Texas Pro, United210). One event, one URL, multiple promotions linked to it.

## Requirements

- **Equal ownership:** All co-promoting promotions have equal standing — no primary/secondary distinction
- **Equal dashboard access:** Any co-promoter's dashboard can edit the event
- **Display everywhere:** All co-promoter logos and names appear on event cards, event detail pages, map popups, and search results
- **Listed on all promotion pages:** A co-promoted event appears in the events list on every co-promoter's promotion page (upcoming and past events)
- **Admin + promoter can manage:** Both admins and promoter dashboards can add/remove co-promoters
- **Scraper support:** Auto-detect co-promotions from Cagematch's comma-separated "Promotion" field

---

## Data Model

### New table: `event_promotions`

```sql
CREATE TABLE event_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, promotion_id)
);

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
```

The INSERT policy has two clauses: the first allows a promoter to create the initial link (their own promotion to a new event); the second allows an existing co-promoter to add another promotion.

### New type: `EventPromotion`

```typescript
export interface EventPromotion {
  event_id: string
  promotion_id: string
  promotions: Pick<Promotion, 'id' | 'name' | 'slug' | 'logo_url'>
}
```

Query results from `event_promotions.select('event_id, promotion_id, promotions(id, name, slug, logo_url)')` return `EventPromotion[]`. Components receiving promotions for an event use this type.

### Migration

Backfill from existing `events.promotion_id`:

```sql
INSERT INTO event_promotions (event_id, promotion_id)
SELECT id, promotion_id FROM events WHERE promotion_id IS NOT NULL;
```

### Transition strategy for `events.promotion_id`

The `events.promotion_id` column remains in the table (not dropped). During transition, ALL event creation (dashboard, admin, scraper) writes to BOTH `events.promotion_id` (first promotion) AND `event_promotions` row(s). This keeps backward compatibility for any queries not yet migrated.

New code reads from `event_promotions`. The column can be dropped in a future cleanup pass once all code is migrated.

---

## Query Changes

All queries that currently filter by `events.promotion_id` switch to joining through `event_promotions`.

### Promotion page events

**Before:**
```typescript
supabase.from('events').select('*').eq('promotion_id', promoId)
```

**After:**
```typescript
supabase.from('event_promotions')
  .select('events(*)')
  .eq('promotion_id', promoId)
```

This returns all events where the promotion is a co-promoter, including co-promoted events.

### Event detail page

**Before:** `event.promotions` is a single object (from FK join).

**After:** Query `event_promotions` for the event to get all promotions:

```typescript
const { data: eventPromotions } = await supabase
  .from('event_promotions')
  .select('event_id, promotion_id, promotions(id, name, slug, logo_url)')
  .eq('event_id', eventId)
```

Returns `EventPromotion[]`.

**Related events:** Currently fetches events from a single `promotion.id`. Changes to fetch events from ALL co-promoters:

```typescript
const coPromoterIds = eventPromotions.map(ep => ep.promotion_id)
const { data: relatedEvents } = await supabase
  .from('event_promotions')
  .select('events(*)')
  .in('promotion_id', coPromoterIds)
  .neq('event_id', eventId)
```

**Championship badges on match cards:** Currently fetches championships for a single promotion. Changes to fetch for ALL co-promoters so champion badges from any participating promotion appear.

### Event browse page

**Before:** `events.select('*, promotions(id, name, slug, logo_url)')`

**After:** Fetch events first, then batch-fetch co-promoters for all event IDs in a single query:

```typescript
const eventIds = events.map(e => e.id)
const { data: allEventPromotions } = await supabase
  .from('event_promotions')
  .select('event_id, promotion_id, promotions(id, name, slug, logo_url)')
  .in('event_id', eventIds)
```

Then group by `event_id` client-side to attach promotions to each event.

### Dashboard event listing

**Before:** `events.eq('promotion_id', myPromotionId)`

**After:**
```typescript
supabase.from('event_promotions')
  .select('events(*)')
  .eq('promotion_id', myPromotionId)
```

### Past events pages

The promotion past events page at `/promotions/[slug]/events` uses the same query pattern — switch to `event_promotions` join so co-promoted events appear in both promotions' past events.

---

## Display Changes

### Display convention

Use " x " to separate co-promoter names: "Rev Pro x CMLL", "Borracho Pro x New Texas Pro x United210". This conveys collaboration rather than a plain list.

### Event detail page (`/events/[id]`)

**"Presented by" section:** Show all co-promoter logos and names side by side. Each links to its promotion page. If only one promotion, looks identical to current behavior.

**Promotion badge at top:** Show all promotion names joined with " x " (e.g., "Rev Pro x CMLL").

### PosterEventCard (compact poster cards)

Currently shows one promotion logo in the bottom overlay. For co-promoted events: show the first promotion's logo with a "+N" badge when 2+ promotions are present (e.g., logo + "+1"). Keeps it compact — poster cards are small. Full list visible on tap/click to the event detail page.

### EventCard (list view)

Show all promotion names as links, separated by " x ".

### Map popups

Show all promotion names in the popup text, separated by " x ".

### Search results

Show all promotion names in the subtitle, separated by " x ".

---

## Dashboard Changes

### Event edit page

Add a **"Co-Promoters"** section below the existing event fields:
- Shows current co-promoters as removable chips/tags
- "Add Co-Promoter" button opens a promotion search/select dropdown
- Removing a co-promoter deletes the `event_promotions` row
- Cannot remove the last promotion (at least one must remain)
- Any co-promoter can add or remove other co-promoters

### Authorization

**Before:** `event.promotions.claimed_by === user.id`

**After:** Check if the user's claimed promotion is in `event_promotions` for this event:

```typescript
const { data } = await supabase
  .from('event_promotions')
  .select('promotion_id, promotions(claimed_by)')
  .eq('event_id', eventId)

const canEdit = data?.some(ep => ep.promotions?.claimed_by === user.id)
```

### Event creation

When a promoter creates an event, both `events.promotion_id` and an `event_promotions` row are set (dual-write for backward compatibility). They can add co-promoters after creation.

---

## Admin Changes

### Admin event editor

Add a multi-select promotion picker to the event editing UI. Admins can:
- See all current co-promoters for an event
- Add promotions (search by name)
- Remove promotions
- Same constraint: at least one promotion must remain

### Admin event creation

The existing admin event creation flow sets a single promotion. Change to allow selecting multiple promotions at creation time. Both `events.promotion_id` (first selected) and `event_promotions` rows are created alongside the event.

---

## Scraper Changes

### Cagematch co-promotion detection

Cagematch represents co-promoted events with a comma-separated "Promotion" field:
```
"Borracho Pro, New Texas Pro Wrestling, United210"
```

**Change to `hottag_sync.py`:**
1. When parsing the promotion field, split on commas
2. Trim each name and look up in the DB
3. For each matched promotion, insert a row into `event_promotions`
4. If a promotion isn't in the DB, follow existing behavior (skip or create depending on config)
5. The first matched promotion is also written to `events.promotion_id` for backward compatibility

This auto-detects co-promotions from scraping with no manual intervention.

---

## Edge Cases

- **Solo events (99% of events):** One row in `event_promotions`. Display is identical to current behavior — no visual change.
- **Removing a co-promoter:** Deleting the `event_promotions` row. If it's the last one, block the deletion.
- **Promotion deleted:** `ON DELETE CASCADE` removes the `event_promotions` row. If this leaves an event with no promotions, the `events.promotion_id` FK (also CASCADE) handles the primary reference. A periodic admin review of orphaned events is recommended.
- **Scraper re-run:** If a co-promotion is added on Cagematch after initial scrape, the next scrape should detect and add the new `event_promotions` row (upsert pattern).

---

## Files Affected

### Database
- New migration: Create `event_promotions` table + RLS + backfill

### Types
- `src/lib/supabase.ts` — Add `EventPromotion` type, update `EventWithPromotion`

### Core query files (switch to junction table)
- `src/lib/promoter.ts` — Event creation/editing, event listing, analytics queries
- `src/lib/admin.ts` — Admin event creation/editing
- `src/app/events/[id]/page.tsx` — Load all promotions, related events, championship badges
- `src/app/events/page.tsx` — Events browse batch-loads co-promoters
- `src/app/promotions/[slug]/page.tsx` — Events query via junction table
- `src/app/promotions/[slug]/events/page.tsx` — Past events via junction table

### Components (display multiple promotions)
- `src/components/EventCard.tsx` — Show all promotion names with " x " separator
- `src/components/PosterEventCard.tsx` — First logo + "+N" badge for co-promoted events

### Dashboard
- `src/app/dashboard/page.tsx` — Events query via junction table
- `src/app/dashboard/events/[id]/page.tsx` — Auth check + co-promoter management UI
- `src/components/PromoterAnalytics.tsx` — Analytics queries via junction table

### Admin
- `src/app/admin/page.tsx` — Multi-promotion event editor

### Pages that display event promotions (update to use co-promoter data)
- `src/app/location/[location]/page.tsx`
- `src/app/venue/[venue]/page.tsx`
- `src/app/map/page.tsx`
- `src/app/search/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/vegas-weekend/page.tsx`
- `src/app/wrestlers/[slug]/page.tsx`
- `src/app/wrestlers/[slug]/events/page.tsx`
- `src/app/crew/[slug]/events/page.tsx`
- `src/components/NearYouSection.tsx`
- `src/components/RecommendedSection.tsx`
- `src/components/ThisWeekendSection.tsx`

### Scraper
- `scripts/hottag_sync.py` — Parse comma-separated promotions, write to junction table + dual-write `events.promotion_id`

---

## Not in Scope

- Invitation/approval flow for co-promotions (any promoter can add any promotion)
- Revenue splitting or co-promotion agreements
- Different permission levels per co-promoter (all are equal)
- Dropping the `events.promotion_id` column (deferred to future cleanup)
