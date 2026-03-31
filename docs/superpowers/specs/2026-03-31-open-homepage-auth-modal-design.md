# Open Homepage & Auth Modal Design

**Date:** 2026-03-31
**Status:** Approved

## Problem

Unauthenticated visitors to hottag.app are redirected to `/welcome` — a sparse landing page with only "Get Started" and "Sign In" buttons. The actual homepage (hero slideshow, event carousels, "Happening Now", etc.) is gated behind authentication. This forces registration before users can see any value, hurting discovery and organic growth.

## Solution

Three focused changes:

1. **Open the homepage** — make `/` and all browse pages public
2. **Signup banner** — value-focused prompt below the hero for logged-out users
3. **Auth modal** — lightweight sign-in modal when logged-out users click interactive features

The `/welcome` page remains functional but is no longer the default landing. Its redesign as a marketing page is deferred.

---

## 1. Open the Homepage

### AuthGate Changes (`src/components/AuthGate.tsx`)

**Critical: The existing `PUBLIC_ROUTES` array uses `startsWith` matching.** Adding `'/'` to that array would match every route in the app (`pathname.startsWith('/')` is always true). To fix this, split the matching into exact-match routes and prefix-match routes:

```typescript
// Exact-match public routes (no sub-path matching)
const EXACT_PUBLIC_ROUTES = new Set([
  '/',
  '/events',
  '/wrestlers',
  '/promotions',
  '/crew',
  '/map',
  '/search',
])

// Prefix-match public routes (match path and all sub-paths)
const PREFIX_PUBLIC_ROUTES = [
  '/welcome',
  '/signin',
  '/signup',
  '/onboarding',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/vegas-weekend',
  '/reset-password',
  '/for-promotions',
  '/blog',
  '/map/record',
]

const isPublic = EXACT_PUBLIC_ROUTES.has(pathname)
  || PREFIX_PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  || isPublicSlugRoute(pathname)
```

Change the unauthenticated redirect target from `/welcome` to `/signin`:

```typescript
// Line 53: was router.replace('/welcome')
router.replace('/signin')
```

This means:
- **Unauthenticated user visits `/`** → sees the full homepage (hero, carousels, events)
- **Unauthenticated user visits `/dashboard`** → redirected to `/signin`
- **Authenticated but not onboarded** → still redirected to `/onboarding`

### No homepage loading changes needed

The homepage's `fetchData()` fires in a `useEffect` with `[user]` as the dependency. On initial mount for an unauthenticated visitor, `user` is `null`. When auth resolution completes and `user` remains `null`, the effect does not re-trigger (same dependency value). Data loads correctly on the first pass — no guards or additional logic needed.

The homepage already conditionally shows/hides personalized sections based on `user` being present:
- "My Events", "From Your Follows", "Recommended" only render when `user` exists
- "Happening Now", "What's New", "Near You", "Hot Events", "Coming Up" are all public data queries

---

## 2. Signup Banner

### New Component: `SignupBanner`

Rendered on the homepage between `HeroSlideshow` and the first content section. Only visible when `!user`.

**Layout (desktop):** Full-width section, single row — headline + subtext on left, button on right.
**Layout (mobile):** Stacks vertically, centered.

**Visual style:** Matches the existing CTA section aesthetic — subtle gradient from `accent/10` to `accent-gold/10`, consistent with the site's dark theme.

**Copy:**
- Headline: "Discover indie wrestling near you"
- Subtext: "Follow wrestlers, track events, get personalized recommendations. Free forever."
- Button: "Sign Up Free" → links to `/signup`

**Not dismissable.** Always visible for logged-out users. Disappears when logged in.

### Remove bottom CTA

The existing "Join the Hot Tag Community" CTA section at the bottom of page.tsx (lines 411-426) is removed. The banner at the top replaces it — one strong placement beats two weaker ones.

---

## 3. Auth Modal

### New Context: `AuthModalContext`

A React context providing `openAuthModal(message: string)` and `closeAuthModal()`. Avoids prop-drilling — any component anywhere can trigger the modal.

**Provider placement:** Inside `LayoutShell` (`src/components/LayoutShell.tsx`), wrapping the content returned by `AuthGate`. This is inside `AuthProvider` (which lives in `layout.tsx`), so `useAuth()` is available. The `AuthModal` component renders as the last child inside the provider:

```tsx
// LayoutShell.tsx
<AuthGate>
  <AuthModalProvider>
    <Navigation />
    <main>{children}</main>
    <Footer />
    <AuthModal />
  </AuthModalProvider>
</AuthGate>
```

### New Component: `AuthModal`

**Trigger:** Logged-out user clicks Follow, Going, Interested, or any action requiring auth.

**Appearance:**
- Centered overlay with dark semi-transparent backdrop (click backdrop to dismiss)
- Card with:
  - Contextual message (passed as prop): e.g., "Sign in to follow wrestlers", "Sign in to RSVP to events"
  - Two buttons: "Sign In" → `/signin?redirect={currentPath}`, "Sign Up Free" → `/signup?redirect={currentPath}`
  - Close X button to dismiss

**Return URL:** Both buttons pass the current page path as a `redirect` query parameter so users return to where they were after signing in. For new signups, the redirect is a known limitation for v1 — onboarding will land them on the homepage rather than preserving the original context.

**Accessibility:**
- `role="dialog"` and `aria-modal="true"` on the modal container
- `aria-labelledby` pointing to the contextual message
- Focus trapped within the modal while open (Tab/Shift+Tab cycles through Sign In, Sign Up, Close)
- Escape key closes the modal
- Focus returns to the triggering element on close

**Design principle:** Buttons are NOT disabled or hidden for logged-out users. They see the same Follow/Going/Interested buttons as logged-in users — clicking them triggers the auth modal. This feels more inviting than greyed-out UI.

### Integration Points

Components that need to call `openAuthModal()` instead of silently returning or redirecting:

- **Follow buttons** on wrestler, promotion, and crew pages
- **Going/Interested buttons** on event pages
- Any other auth-gated action on public pages

Pattern:
```typescript
const { user } = useAuth()
const { openAuthModal } = useAuthModal()

const handleFollow = () => {
  if (!user) {
    openAuthModal('Sign in to follow this wrestler')
    return
  }
  // existing follow logic
}
```

### Sign-in redirect handling

The `/signin` page needs to check for a `redirect` query parameter and navigate there after successful authentication instead of defaulting to `/`. This is a small change to the existing sign-in flow.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/AuthGate.tsx` | Split into exact/prefix public routes, change redirect to `/signin` |
| `src/app/page.tsx` | Add `SignupBanner` below hero, remove bottom CTA |
| `src/components/SignupBanner.tsx` | **New** — value-focused signup prompt |
| `src/lib/auth-modal-context.tsx` | **New** — context + provider for triggering auth modal |
| `src/components/AuthModal.tsx` | **New** — sign-in/sign-up modal with accessibility |
| `src/components/LayoutShell.tsx` | Wrap content with `AuthModalProvider`, render `AuthModal` |
| `src/app/signin/page.tsx` | Honor `redirect` query param after successful sign-in |
| Wrestler/promotion/crew/event pages | Replace silent auth guards with `openAuthModal()` calls |

## Deferred

- `/welcome` page redesign as marketing/explainer page (keep functional as-is)
- Return URL preservation through onboarding flow for new signups
