# CLAUDE.md — Hot Tag Project Reference

## What is Hot Tag?

Hot Tag is a professional wrestling event discovery platform that helps fans find indie wrestling shows, follow wrestlers, and connect with the wrestling community. Think "Letterboxd meets Bandsintown" for pro wrestling.

**Live site:** https://www.hottag.app
**Owner:** Dan (Houston, TX)
**Business entity:** Hot Tag LLC (Texas)
**NAICS:** 519290 (Information Services Platform)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Styling:** Tailwind CSS (dark theme)
- **Maps:** Mapbox GL JS
- **Icons:** Lucide React
- **Deployment:** Vercel
- **Domain:** hottag.app (www.hottag.app)
- **Data pipeline:** Python scrapers (Cagematch, promotion sites)

### Dev Commands

```bash
cd src
npm install
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_APP_URL=https://www.hottag.app
```

---

## Design System

### Colors
- Background: `#14181c` (dark charcoal)
- Secondary: `#1c2228`
- Tertiary: `#2a3038`
- Accent: `#ff6b35` (fire orange)
- Gold: `#ffd700` (wrestling gold)
- Border: `#2d333b`

### Typography
- Display: Space Grotesk
- Body: Inter

### Design Principles
- Dark theme throughout (Letterboxd-inspired)
- 4:5 aspect ratio hero cards for wrestlers (with hero_style backgrounds)
- 3:4 poster cards for events (object-top to show promotion logos)
- Accent orange for CTAs, gold for championships/premium elements
- Purple for crew/professional elements
- Mobile-first responsive design

---

## Project Structure

```
hottag/
├── database/              # SQL migrations & fixes
├── scripts/               # Python scrapers & data loaders
│   ├── hottag_sync.py     # Unified event sync pipeline
│   ├── cagematch_scraper_v5.py
│   └── scrape-all-champions.mjs
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Homepage (hero slideshow + carousels)
│   │   ├── layout.tsx     # Root layout
│   │   ├── admin/         # Admin panel (tabbed interface)
│   │   ├── auth/          # Auth callback
│   │   ├── crew/          # Crew browse + [slug] profiles
│   │   ├── dashboard/     # User dashboards
│   │   │   ├── page.tsx           # Promoter dashboard
│   │   │   ├── wrestler/          # Wrestler dashboard
│   │   │   ├── professional/      # Crew dashboard
│   │   │   ├── events/[id]/       # Event management
│   │   │   ├── roster/            # Roster management
│   │   │   └── promotion/         # Promotion settings
│   │   ├── events/        # Events browse + [id] detail
│   │   ├── location/      # Location-based event pages
│   │   ├── map/           # Interactive map with urgency pins
│   │   ├── onboarding/    # New user onboarding flow
│   │   ├── privacy/       # Privacy policy
│   │   ├── profile/       # User profile + past events
│   │   ├── promotions/    # Promotions browse + [slug] pages
│   │   ├── search/        # Global search
│   │   ├── signin/        # Sign in
│   │   ├── signup/        # Sign up
│   │   ├── terms/         # Terms of service
│   │   ├── vegas-weekend/ # Special event hub (auto-hides after Apr 20)
│   │   ├── venue/         # Venue-specific pages
│   │   ├── welcome/       # Landing page (unauthenticated)
│   │   └── wrestlers/     # Wrestlers browse + [slug] profiles
│   ├── components/        # ~40 React components
│   ├── lib/               # Utilities & API functions
│   │   ├── supabase.ts    # Server-side Supabase + constants
│   │   ├── supabase-browser.ts  # Client-side Supabase
│   │   ├── auth-context.tsx     # Auth + onboarding context
│   │   ├── promoter.ts    # Promoter dashboard CRUD
│   │   ├── wrestler.ts    # Wrestler dashboard CRUD
│   │   ├── professional.ts # Crew dashboard CRUD
│   │   ├── admin.ts       # Admin functions
│   │   ├── geocode.ts     # Mapbox geocoding (rejects city-center fallbacks)
│   │   ├── hero-themes.ts # Wrestler hero card CSS generation
│   │   ├── countries.ts   # Country codes, flags, names
│   │   └── utils.ts       # Date formatting, helpers
│   └── styles/
│       └── globals.css    # CSS custom properties + utilities
└── public/
    └── flags/             # Country flag images
```

---

## Database Schema (Key Tables)

### Core Entities
- **events** — shows with date, venue, city, state, lat/lng, poster_url, ticket_url, promotion_id, vegas_weekend, vegas_collective
- **wrestlers** — name, slug, photo_url, render_url, hero_style, moniker, bio, stats, social links, signature_moves, wrestling_style[], claimed_by, verification_status
- **promotions** — name, slug, logo_url, region, social links, claimed_by, verification_status, onboarding_featured
- **professionals** — crew members with name, slug, role[] (15 roles), portfolio, social links, claimed_by

### Relationships
- **wrestler_promotions** — roster associations (is_active)
- **event_wrestlers** — wrestlers linked to events
- **event_announced_talent** — announced talent with sort_order, announcement_note
- **event_announced_crew** — announced crew for events
- **event_matches** — match cards with type, stipulation, title_match
- **match_participants** — wrestlers in matches with side/outcome
- **professional_promotions** — crew "Works With" associations (pending/accepted/rejected)

### Championships
- **championships** — title belts per promotion, current_champion, champion_group support
- **championship_history** — title lineage

### User System
- **user_profiles** — user_type (fan/wrestler/promoter/crew), onboarding state
- **user_follows_wrestler/promotion/professional** — follow relationships
- **event_attendance** — going/interested RSVPs
- **wrestler_claims / promotion_claims / professional_claims** — claim code verification

### Content
- **hero_slides** — homepage slideshow images
- **profile_videos** — multi-video per wrestler/promotion/professional
- **wrestler_merch_items / promotion_merch_items / professional_merch_items** — merch galleries
- **professional_portfolio** — crew portfolio items
- **promotion_groups** — tag teams & factions

### Special
- **vegas_weekend_collectives** — event hub groupings
- **page_requests** — user requests for new wrestler/promotion/crew pages

---

## Authentication & Authorization

### Auth Flow
1. Supabase Auth (email/password)
2. AuthGate component protects routes
3. Unauthenticated → /welcome
4. Authenticated but not onboarded → /onboarding
5. Onboarded → full access

### Public Routes (no auth required)
`/welcome`, `/signin`, `/signup`, `/onboarding`, `/auth/callback`, `/privacy`, `/terms`, `/vegas-weekend`, and all slug routes (`/wrestlers/[slug]`, `/promotions/[slug]`, `/crew/[slug]`, `/events/[id]`)

### Claim System
1. Admin creates page → generates claim code
2. Wrestler/promoter/crew enters claim code on public page
3. Claim goes to admin for approval
4. Approval sets claimed_by, grants dashboard access
5. Auto-redirect to dashboard on success (2s delay)

### Row Level Security (RLS)
All tables have RLS enabled. Policies follow pattern:
- Public read for all published data
- Write restricted to owners (claimed_by = auth.uid()) or promotion admins
- Admin functions use service role key

---

## Key Features

### Homepage
- Hero slideshow (1920×1080, 6s intervals, auto-cycle)
- Event carousels: This Weekend, Near You, Recommended
- Poster event cards (3:4, object-top)

### Map
- Mapbox GL with custom markers
- Urgency visualization: size, opacity, pulse animation
  - This week: 36px, 100% opacity, pulsing
  - This month: 28px, 85% opacity
  - Later: 16px, 45% opacity
- Pin clustering at 3 decimal places (~111m)
- Legend at bottom-left (bottom-10 to clear Mapbox attribution)

### Wrestler Pages
- Hero section with themed backgrounds (flags, gradients, textures)
- Render images with CSS mask blending
- Stats card: height, weight, born, from, resides, debut, trainer, wrestling styles, signature moves
- Follow button with inline follower count (· count)
- QR code, share, social links
- Championships, videos, merch gallery
- Past events list

### Promotion Pages
- Logo, description, social links
- Championships section (gold borders, crown icons)
- Roster carousel (hero cards)
- Crew section (grid with role labels)
- Tag teams & factions
- Upcoming events, videos, merch

### Event Pages
- Poster hero image
- Title with QR/Share right-justified on same line
- Key info grid (date, time, location, price)
- Action buttons: Get Tickets, Coupon, Streaming links
- Attendance buttons (Going/Interested)
- Announced Talent + Announced Crew sections
- Match cards with hero wrestler cards
- Map embed

### Dashboards
- **Promoter:** Event management (create/edit/delete), announced talent & crew, match cards, streaming links, merch, videos, coupon codes
- **Wrestler:** Bio, stats, signature moves, wrestling styles, hero theme, social links, merch, videos
- **Crew:** Bio, roles, portfolio, social links, merch, videos

### Admin Panel (tabbed)
- Overview, Events, Wrestlers, Promotions, Crew, Championships
- Wrestler Claims, Promotion Claims, Crew Claims
- Page Requests, Hero Images, Vegas Weekend

### Onboarding
- Step 0: Choose type (Fan, Wrestler, Promoter, Crew)
- Fan: Pick promotions → Pick wrestlers
- Wrestler/Promoter/Crew: Search & claim existing page or request new one

---

## Crew Roles (15)

referee, photographer, videographer, video_editor, camera_operator, graphic_designer, ring_announcer, commentator, manager_valet, producer, director, trainer, dj_music, ring_crew, other

## Wrestling Styles (12)

brawler, grappler, luchador, strong_style, high_flyer, technical, hybrid, powerhouse, hardcore, submission_specialist, comedy, deathmatch

---

## Geocoding

Uses Mapbox Geocoding API (`src/lib/geocode.ts`). Critical behavior:
- Only accepts POI and address-level results
- **Rejects** city/region/country-level results (prevents city-center pins)
- No fallback to city-only queries
- Null coordinates are better than wrong coordinates
- Auto-geocodes on promoter event create/update when location fields change

---

## Image Specifications

| Image Type | Dimensions | Ratio | Format |
|---|---|---|---|
| Homepage hero slides | 1920×1080 | 16:9 | JPG/PNG |
| Vegas Weekend page hero | 1920×600 | 3.2:1 | JPG/PNG |
| Collective hero images | 1200×500 | 2.4:1 | JPG/PNG |
| Event posters | 600×800 | 3:4 | JPG/PNG |
| Promotion logos | 400×400 | 1:1 | PNG (transparent) |
| Wrestler renders | 600×750 | 4:5 | PNG (transparent) |
| Wrestler profile photos | 400×400 | 1:1 | JPG/PNG |
| Flag backgrounds | 1920×1080 | 16:9 | JPG |
| Merch items | 600×600 | 1:1 | JPG/PNG |
| Portfolio items (crew) | 800×600 | 4:3 | JPG/PNG |

---

## Navigation Order

**Desktop:** Events → Map → Wrestlers → Promotions → Crew (+ Vegas Weekend gold item, auto-hides after Apr 20, 2026)

**Mobile:** Same order in hamburger menu, Vegas Weekend as compact gold pill in header bar

---

## Data Pipeline

### Scrapers (Python)
- `hottag_sync.py` — unified sync pipeline for all promotions
- `cagematch_scraper_v5.py` — Cagematch event/wrestler data
- `scrape-all-champions.mjs` — Championship data from Cagematch

### Supabase Storage Buckets
- `event-posters` — event poster images
- `promotion-logos` — promotion logos, wrestler renders, hero images, merch, portfolio, vegas images
- `wrestler-photos` — wrestler profile photos

---

## Known Patterns & Gotchas

1. **events_with_counts view was dropped** — all queries use events table directly with fallbacks for count fields
2. **State field is critical for geocoding** — missing state causes wrong-city pins (Portland ME → OR, etc.)
3. **RLS on all tables** — new tables MUST have RLS enabled + policies or Supabase linter will flag
4. **Dynamic imports for client-side Supabase** — admin panel uses `(await import('@/lib/supabase-browser')).createClient()`
5. **Auth context re-renders** — use useRef guards to prevent data reload on auth listener firing (e.g., tab focus)
6. **Claim approval creates unclaimed pages** — does NOT auto-claim for requester. Admin must generate claim code separately.
7. **ring-* classes clip under overflow-hidden** — use border-* instead for gold champion borders
8. **Flag images** are in Supabase Storage, referenced via hero_style.value URL
9. **Poster cards use object-top** — top of poster (logo/show name) prioritized over bottom (redundant info)

---

## Business Context

### Strategy
Wrestlers and promoters are the driving "sales team" for fans. If they actively use Hot Tag, it becomes the most important link they share on social. Features prioritized to make wrestler/promoter pages worth sharing over Linktree.

### Engagement Features (completed)
1. QR codes — physical distribution at events
2. YouTube/video embeds — makes page worth sharing
3. Merch gallery with links — replaces external tool
4. Promoter coupon codes — ties Hot Tag to ticket revenue

### Legal Status
- **LLC:** Hot Tag LLC (Texas) — formation in progress
- **EIN:** Apply after LLC approval
- **Trademark:** File under LLC in Classes 41 & 42 after EIN
- **Trademark research:** "Hot Tag" is clear — prior FL LLC (Big Cheese Promotions) abandoned name in 2013, UK foundation has no US presence, "Hot Tag Wrestling Signings" is small autograph shop in different service class

### NAICS Code
519290 — Other Information Services

---

## Vegas Weekend (Special Event Hub)

Temporary feature for WrestleMania weekend events in Las Vegas (April 15-19, 2026).
- Nav item auto-hides after April 20, 2026 11PM PT
- Events tagged with vegas_weekend = true, optional vegas_collective assignment
- Collectives: The Collective (Horseshoe), Shooting Star Fest (Bizarre Bar), HyperX Arena
- Public route (no auth required)
