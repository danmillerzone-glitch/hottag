# Admin Create Event Modal — Design Spec

## Summary

Add a "Create Event" modal to the admin panel's Events tab, allowing admins to manually create events with all fields. This fills a gap where events can currently only be created via the promoter dashboard (requires a claimed promotion) or via scrapers.

## Context

- **Admin panel:** `src/app/admin/page.tsx`
- **Existing edit modal:** `EditEventModal` component (line ~2776) — limited fields, saves via `updateEventAdmin()`
- **Promoter creation flow:** `createEvent()` in `src/lib/promoter.ts` (line ~771) — requires auth as promoter
- **Admin functions:** `src/lib/admin.ts` — browser client for reads, `adminApi()` for writes that need service role key
- **Admin API route:** `src/app/api/admin/route.ts` — generic CRUD handler using service role key, `events` already in `ALLOWED_TABLES`

## Requirements

1. Full-field event creation form in a modal (consistent with existing `EditEventModal` pattern)
2. Promotion selected via search/select from existing promotions
3. Poster images via URL fields only (no upload/crop)
4. Auto-geocoding on save (same behavior as promoter dashboard)
5. Collapsible sections so the modal isn't overwhelming
6. Slug auto-generated from event name + date suffix for uniqueness

## Design

### Entry Point

An "Add Event" button in the Events tab header (next to the search bar). Clicking opens the `CreateEventModal`.

### Modal Layout

The modal is scrollable with collapsible sections. Only Section 1 (Core) is expanded by default.

**Section 1 — Core (always expanded)**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text input | yes | Event title |
| event_date | date input | yes | ISO date |
| promotion_id | search/select | yes | Searches existing promotions by name |

**Section 2 — Location (collapsed)**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| venue_name | text input | no | |
| venue_address | text input | no | Street address for geocoding |
| city | text input | no | Critical for geocoding accuracy |
| state | text input | no | Critical — missing state causes wrong pins |
| country | text input | no | Defaults to "USA" |

**Section 3 — Times & Tickets (collapsed)**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| doors_time | time input | no | |
| event_time | time input | no | Bell time |
| ticket_url | text input | no | |
| ticket_price_min | number input | no | |
| ticket_price_max | number input | no | |
| is_free | checkbox | no | |
| is_sold_out | checkbox | no | |
| coupon_code | text input | no | |
| coupon_label | text input | no | Description of coupon |

**Section 4 — Media & Description (collapsed)**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| poster_url | text input | no | 600x800, 3:4 ratio |
| landscape_poster_url | text input | no | For carousel |
| description | textarea | no | Long-form event description |
| hashtag | text input | no | Stored without # prefix |

**Section 5 — Venue Amenities (collapsed)**

Rendered dynamically from `VENUE_AMENITY_GROUPS` in `src/lib/venue-event-constants.ts`. Groups:
- Age Restriction (radio with `key` field)
- Food & Drink (checkboxes)
- Parking (checkboxes)
- Accessibility (checkboxes)
- Seating (checkboxes)
- Venue Type (checkboxes)
- Amenities (checkboxes)
- Payment (checkboxes)
- Policies (checkboxes)

All keys and group types are defined in the constants file — the modal iterates `VENUE_AMENITY_GROUPS` to render, not hardcoded.

**Section 6 — Event Tags (collapsed)**

Multi-select tag buttons rendered from `EVENT_TAG_GROUPS` and `EVENT_TAG_LABELS` in `src/lib/venue-event-constants.ts`. Groups:
- Event Style: deathmatch, strong_style, lucha_libre, hardcore, comedy
- Roster: all_women, intergender, student_showcase, micro_wrestling
- Format: tournament, supercard, tv_taping, ppv_ippv, anniversary_show, debut_show
- Special: fan_fest, meet_and_greet, watch_party, fundraiser_charity
- Vibe: family_friendly, parental_discretion, extreme_adults_only, live_music, themed_event

**Section 7 — Special (collapsed)**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vegas_weekend | checkbox | no | Part of Vegas Weekend hub |
| vegas_collective | select | no | Only shown when vegas_weekend is true. Options loaded dynamically from `vegas_weekend_collectives` table |
| streaming_url | text input | no | Legacy single URL field |

### Save Behavior

1. Validate required fields (name, event_date, promotion_id)
2. Generate slug: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')` + `-YYYY-MM-DD` date suffix to avoid collisions (recurring show names are common)
3. Strip leading `#` from hashtag if present
4. Set `country` default: `country || 'USA'`
5. Set `status: 'upcoming'`, `admin_edited: true`
6. If any location fields provided (city, state, venue_name, or venue_address), geocode client-side via `geocodeVenue()` from `src/lib/geocode.ts` to get lat/lng
7. Insert into `events` table via `adminApi({ action: 'insert', table: 'events', data: {...} })` — this goes through the service role API route, bypassing RLS
8. On success: close modal, refresh event list, show success message
9. On error: show error message, keep modal open

### Promotion Search

- Text input with debounced search (300ms)
- Queries promotions table by name (case-insensitive, ILIKE) via updated `searchPromotions()` that includes `logo_url`
- Dropdown shows matching promotions with name (and logo if available)
- Selected promotion shown as pill with name + X to clear

## Files Changed

### `src/lib/admin.ts`
- Update `searchPromotions()` to include `logo_url` in the select
- Add `createEventAdmin(eventData)` function:
  - Geocodes client-side if location fields present (uses `NEXT_PUBLIC_MAPBOX_TOKEN`)
  - Generates slug with date suffix
  - Inserts via `adminApi({ action: 'insert', table: 'events', data })` (service role, bypasses RLS)
  - Returns created event or throws error

### `src/app/admin/page.tsx`
- Add `CreateEventModal` component with all sections described above
- Import `VENUE_AMENITY_GROUPS`, `EVENT_TAG_GROUPS`, `EVENT_TAG_LABELS` from `src/lib/venue-event-constants.ts`
- Add "Add Event" button to EventsTab header
- Add state management for modal open/close and form data

## Out of Scope

- Image upload/crop (URL fields only)
- Announced talent, crew, or match card management (use promoter dashboard post-creation)
- Multi-link streaming management (just the legacy `streaming_url` field)
- Event duplication or templates
- Timezone field (uses database default `America/Chicago`)
