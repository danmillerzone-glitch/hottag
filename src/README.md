# 🔥 HotTag Web App

The indie wrestling event tracker - built with Next.js 14, Supabase, and Mapbox.

## Quick Start

### 1. Install Dependencies

```bash
cd src
npm install
```

### 2. Environment Variables

The `.env.local` file is already configured with your credentials:
- Supabase URL and keys
- Mapbox token

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout with navigation
│   ├── globals.css        # Global styles
│   ├── events/            # Events pages
│   │   ├── page.tsx       # Events listing
│   │   └── [id]/page.tsx  # Event detail
│   ├── map/               # Map view
│   │   └── page.tsx
│   ├── wrestlers/         # Wrestlers pages
│   │   └── page.tsx
│   └── promotions/        # Promotions pages
│       └── page.tsx
├── components/            # React components
│   ├── Navigation.tsx     # Header & mobile nav
│   └── EventCard.tsx      # Event card component
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client & API
│   └── utils.ts           # Helper functions
└── styles/                # Additional styles
```

## Features

### Phase 1 (MVP) ✅
- [x] Event calendar listing
- [x] Interactive map with event markers
- [x] Promotions listing by region
- [x] Wrestlers listing
- [x] Event detail pages
- [x] Responsive design (mobile-first)
- [x] Dark theme (Letterboxd-inspired)

### Phase 2 (Coming Soon)
- [ ] User authentication
- [ ] Follow wrestlers
- [ ] Mark attending/interested
- [ ] Wrestler/Promotion verification
- [ ] Search functionality

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Maps:** Mapbox GL JS
- **Icons:** Lucide React
- **Deployment:** Vercel

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Vercel

Add these in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://floznswkfodjuigfzkki.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiaG90dGFnYXBwIi...
NEXT_PUBLIC_APP_URL=https://hottag.app
```

## Custom Domain (hottag.app)

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add `hottag.app`
4. Update DNS records at your domain registrar:
   - Type: `A` Record → `76.76.21.21`
   - Type: `CNAME` → `cname.vercel-dns.com`

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Design System

### Colors
- Background: `#14181c` (dark charcoal)
- Secondary: `#1c2228`
- Accent: `#ff6b35` (fire orange)
- Gold: `#ffd700` (wrestling gold)

### Typography
- Display: Space Grotesk
- Body: Inter

## Need Help?

Check the main project README in the root folder for:
- Database schema
- Scraper setup
- Full project documentation
