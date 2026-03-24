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

-- Promoters can manage their own events
CREATE POLICY "Promoter manage" ON event_promotions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM event_promotions ep
    JOIN promotions p ON p.id = ep.promotion_id
    WHERE ep.event_id = event_promotions.event_id
    AND p.claimed_by = auth.uid()
  )
);
```

### Migration

Backfill from existing `events.promotion_id`:

```sql
INSERT INTO event_promotions (event_id, promotion_id)
SELECT id, promotion_id FROM events WHERE promotion_id IS NOT NULL;
```

The `events.promotion_id` column remains in the table (not dropped) to avoid breaking anything during the transition. New code reads from `event_promotions`. The column can be dropped in a future cleanup pass once all code is migrated.

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
supabase.from('event_promotions')
  .select('promotions(id, name, slug, logo_url)')
  .eq('event_id', eventId)
```

Returns an array of promotions.

### Event browse page

**Before:** `events.select('*, promotions(id, name, slug, logo_url)')`

**After:** Need to include all co-promoters. Two options:
1. Fetch events, then batch-fetch `event_promotions` for those event IDs
2. Use a database view that aggregates promotions per event

Option 1 is simpler and follows existing patterns.

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

### Event detail page (`/events/[id]`)

**"Presented by" section:** Show all co-promoter logos and names side by side. Each links to its promotion page. If only one promotion, looks identical to current behavior.

**Promotion badge at top:** Show all promotion names (e.g., "Rev Pro x CMLL" or "Borracho Pro · New Texas Pro · United210").

### PosterEventCard (compact poster cards)

Currently shows one promotion logo in the bottom overlay. For co-promoted events:
- Show first promotion logo + "x [count]" indicator if 2+ promotions
- Or show overlapping logos (up to 2-3, then "+N")
- Keep it compact — poster cards are small

### EventCard (list view)

Show all promotion names as links, separated by " x " or " · ".

### Map popups

Show all promotion names in the popup text.

### Search results

Show all promotion names in the subtitle.

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

When a promoter creates an event, a row is inserted into `event_promotions` linking the event to their promotion (instead of setting `events.promotion_id`). They can add co-promoters after creation.

---

## Admin Changes

### Admin event editor

Add a multi-select promotion picker to the event editing UI. Admins can:
- See all current co-promoters for an event
- Add promotions (search by name)
- Remove promotions
- Same constraint: at least one promotion must remain

### Admin event creation

The existing admin event creation flow sets a single promotion. Change to allow selecting multiple promotions at creation time. The `event_promotions` rows are created alongside the event.

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
5. The first matched promotion is used as `events.promotion_id` for backward compatibility during migration

This auto-detects co-promotions from scraping with no manual intervention.

---

## Edge Cases

- **Solo events (99% of events):** One row in `event_promotions`. Display is identical to current behavior — no visual change.
- **Removing a co-promoter:** Deleting the `event_promotions` row. If it's the last one, block the deletion.
- **Promotion deleted:** `ON DELETE CASCADE` removes the `event_promotions` row. If this leaves an event with no promotions, a cleanup job or admin review may be needed.
- **Scraper re-run:** If a co-promotion is added on Cagematch after initial scrape, the next scrape should detect and add the new `event_promotions` row (upsert pattern).

---

## Files Affected

### Database
- New migration: Create `event_promotions` table + RLS + backfill

### Server/queries
- `src/lib/supabase.ts` — Update `Event`/`EventWithPromotion` types
- `src/lib/promoter.ts` — Event creation/editing uses `event_promotions`
- `src/lib/admin.ts` — Admin event creation/editing uses `event_promotions`
- `src/app/events/[id]/page.tsx` — Query and display multiple promotions
- `src/app/events/page.tsx` — Events browse loads co-promoters
- `src/app/promotions/[slug]/page.tsx` — Events query via junction table
- `src/app/promotions/[slug]/events/page.tsx` — Past events via junction table

### Components
- `src/components/EventCard.tsx` — Display multiple promotions
- `src/components/PosterEventCard.tsx` — Display multiple promotion logos

### Dashboard
- `src/app/dashboard/page.tsx` — Events query via junction table
- `src/app/dashboard/events/[id]/page.tsx` — Auth check + co-promoter management UI

### Admin
- `src/app/admin/page.tsx` — Multi-promotion event editor

### Scraper
- `scripts/hottag_sync.py` — Parse comma-separated promotions, write to junction table

---

## Not in Scope

- Invitation/approval flow for co-promotions (any promoter can add any promotion)
- Revenue splitting or co-promotion agreements
- Different permission levels per co-promoter (all are equal)
- Dropping the `events.promotion_id` column (deferred to future cleanup)
