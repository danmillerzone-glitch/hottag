# Venue Amenities & Event Tags — Integration Guide

Everything is pre-built. Follow these steps to wire it all together.

## Step 1: Run the Migration

Run `database/migration-venue-amenities-event-tags.sql` in the Supabase SQL editor.
This adds `venue_amenities` (jsonb) and `event_tags` (text[]) columns to the events table.

## Step 2: Files Already Created (just deploy)

These files are ready to go:
- `src/lib/venue-event-constants.ts` — All constants, labels, groups
- `src/components/VenueEventEditors.tsx` — VenueAmenitiesEditor + EventTagsEditor
- `src/components/VenueEventDisplay.tsx` — VenueAmenitiesDisplay + EventTagsDisplay
- `src/components/EventTagsPicker.tsx` — Simpler tag picker (optional)
- `src/components/EventTagsDisplay.tsx` — Simpler tag display (optional)

## Step 3: Update Promoter Lib (`src/lib/promoter.ts`)

Add `venue_amenities` and `event_tags` to the createEvent and updateEvent functions:

### In createEvent():
Add to the insert object:
```ts
venue_amenities: data.venue_amenities || {},
event_tags: data.event_tags || [],
```

### In updateEvent():
Add to the update object:
```ts
venue_amenities: data.venue_amenities,
event_tags: data.event_tags,
```

## Step 4: Update Dashboard Event Page (`src/app/dashboard/events/[id]/page.tsx`)

### Add imports:
```tsx
import { VenueAmenitiesEditor, EventTagsEditor } from '@/components/VenueEventEditors'
```

### Add state:
```tsx
const [venueAmenities, setVenueAmenities] = useState<Record<string, any>>({})
const [eventTags, setEventTags] = useState<string[]>([])
```

### Load from event data (in useEffect or data fetch):
```tsx
setVenueAmenities(event.venue_amenities || {})
setEventTags(event.event_tags || [])
```

### Add to save function payload:
```tsx
venue_amenities: venueAmenities,
event_tags: eventTags,
```

### Add editors to the form (after streaming links, before announced talent):
```tsx
<VenueAmenitiesEditor amenities={venueAmenities} onChange={setVenueAmenities} />
<EventTagsEditor tags={eventTags} onChange={setEventTags} />
```

## Step 5: Update Event Detail Page (`src/app/events/[id]/page.tsx`)

### Add imports:
```tsx
import { VenueAmenitiesDisplay, EventTagsDisplay } from '@/components/VenueEventDisplay'
```

### Add displays (after action buttons, before attendance or description):
```tsx
{event.event_tags && event.event_tags.length > 0 && (
  <EventTagsDisplay tags={event.event_tags} />
)}

{event.venue_amenities && Object.keys(event.venue_amenities).length > 0 && (
  <VenueAmenitiesDisplay amenities={event.venue_amenities} />
)}
```

## Step 6: Update Supabase Event Interface (`src/lib/supabase.ts`)

Add to the Event interface:
```ts
venue_amenities?: Record<string, any> | null
event_tags?: string[] | null
```

## Step 7: Update Event Query Select

Make sure any event queries include the new columns. They should be included
automatically if you're using `select('*')`, but if you have specific column
selects, add `venue_amenities, event_tags` to them.
