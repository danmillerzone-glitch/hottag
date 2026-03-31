# Open Homepage & Auth Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove forced registration, open the homepage and browse pages to unauthenticated users, add a signup banner and auth modal for interactive actions.

**Architecture:** Three independent changes: (1) update AuthGate route matching to split exact vs prefix public routes, (2) add a SignupBanner component on the homepage, (3) add AuthModalContext + AuthModal for auth-gated button clicks. All changes are client-side React components.

**Tech Stack:** Next.js 14 (App Router), React Context, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-31-open-homepage-auth-modal-design.md`

---

### Task 1: Open Public Routes in AuthGate

**Files:**
- Modify: `src/components/AuthGate.tsx`

- [ ] **Step 1: Split PUBLIC_ROUTES into exact-match and prefix-match**

Replace the current `PUBLIC_ROUTES` array and matching logic:

```typescript
// Routes that use exact matching (no sub-path matching)
const EXACT_PUBLIC_ROUTES = new Set([
  '/',
  '/events',
  '/wrestlers',
  '/promotions',
  '/crew',
  '/map',
  '/search',
])

// Routes that use prefix matching (match path and all sub-paths)
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
```

Update line 44 to use split matching:

```typescript
const isPublic = EXACT_PUBLIC_ROUTES.has(pathname)
  || PREFIX_PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  || isPublicSlugRoute(pathname)
```

- [ ] **Step 2: Change unauthenticated redirect from /welcome to /signin**

On line 53, change:
```typescript
// was: router.replace('/welcome')
router.replace('/signin')
```

- [ ] **Step 3: Verify manually**

Run: `cd src && npm run dev`

Test:
1. Open `localhost:3000` in incognito — should see the full homepage (hero slideshow, event carousels), NOT get redirected to /welcome
2. Open `localhost:3000/events` — should work without auth
3. Open `localhost:3000/wrestlers` — should work without auth
4. Open `localhost:3000/dashboard` — should redirect to `/signin`
5. Open `localhost:3000/admin` — should redirect to `/signin`

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthGate.tsx
git commit -m "feat: open homepage and browse pages to unauthenticated users"
```

---

### Task 2: Add Signup Banner to Homepage

**Files:**
- Create: `src/components/SignupBanner.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create SignupBanner component**

Create `src/components/SignupBanner.tsx`:

```tsx
'use client'

import Link from 'next/link'

export default function SignupBanner() {
  return (
    <section className="py-6 bg-gradient-to-r from-accent/10 to-accent-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-display font-bold">
            Discover indie wrestling near you
          </h2>
          <p className="text-sm text-foreground-muted mt-1">
            Follow wrestlers, track events, get personalized recommendations. Free forever.
          </p>
        </div>
        <Link href="/signup" className="btn btn-primary whitespace-nowrap">
          Sign Up Free
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add SignupBanner to homepage below hero, remove bottom CTA**

In `src/app/page.tsx`:

1. Add import at top:
```typescript
import SignupBanner from '@/components/SignupBanner'
```

2. After the `<HeroSlideshow>` section and before the first content section, add:
```tsx
{!user && <SignupBanner />}
```

3. Remove the existing bottom CTA section (lines ~411-426):
```tsx
{/* Remove this entire block: */}
{!user && (
  <section className="py-16 bg-gradient-to-r from-accent/10 to-accent-gold/10">
    ...Join the Hot Tag Community...
  </section>
)}
```

- [ ] **Step 3: Verify manually**

Run dev server. In incognito:
1. Homepage should show the signup banner directly below the hero slideshow
2. Banner should show headline, subtext, and "Sign Up Free" button
3. On mobile viewport, banner should stack vertically
4. Sign in with an account — banner should disappear
5. The old bottom CTA ("Join the Hot Tag Community") should be gone

- [ ] **Step 4: Commit**

```bash
git add src/components/SignupBanner.tsx src/app/page.tsx
git commit -m "feat: add signup banner below hero for logged-out users"
```

---

### Task 3: Create Auth Modal Context and Component

**Files:**
- Create: `src/lib/auth-modal-context.tsx`
- Create: `src/components/AuthModal.tsx`
- Modify: `src/components/LayoutShell.tsx`

- [ ] **Step 1: Create AuthModalContext**

Create `src/lib/auth-modal-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface AuthModalContextType {
  isOpen: boolean
  message: string
  openAuthModal: (message: string) => void
  closeAuthModal: () => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  message: '',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  triggerRef: { current: null },
})

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const triggerRef = useRef<HTMLElement | null>(null)

  const openAuthModal = useCallback((msg: string) => {
    triggerRef.current = document.activeElement as HTMLElement
    setMessage(msg)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    // Restore focus to trigger element
    setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isOpen, message, openAuthModal, closeAuthModal, triggerRef }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
```

- [ ] **Step 2: Create AuthModal component**

Create `src/components/AuthModal.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useAuthModal } from '@/lib/auth-modal-context'

export default function AuthModal() {
  const { isOpen, message, closeAuthModal } = useAuthModal()
  const modalRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableEls = modal.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstEl = focusableEls[0]
    const lastEl = focusableEls[focusableEls.length - 1]

    firstEl?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal()
        return
      }
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeAuthModal])

  if (!isOpen) return null

  const redirect = encodeURIComponent(pathname)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-message"
        className="relative w-full max-w-sm bg-background-secondary border border-border rounded-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 p-1 text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-modal-message" className="text-lg font-display font-bold text-center mb-2 pr-6">
          {message}
        </h2>
        <p className="text-sm text-foreground-muted text-center mb-6">
          Create a free account or sign in to continue.
        </p>

        <div className="space-y-3">
          <Link
            href={`/signup?redirect=${redirect}`}
            className="btn btn-primary w-full flex items-center justify-center"
            onClick={closeAuthModal}
          >
            Sign Up Free
          </Link>
          <Link
            href={`/signin?redirect=${redirect}`}
            className="btn btn-secondary w-full flex items-center justify-center"
            onClick={closeAuthModal}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire AuthModalProvider into LayoutShell**

In `src/components/LayoutShell.tsx`:

1. Add imports:
```typescript
import { AuthModalProvider } from '@/lib/auth-modal-context'
import AuthModal from '@/components/AuthModal'
```

2. Wrap the non-chromeless layout branch with `AuthModalProvider` and add `<AuthModal />`:

The normal layout return (lines 31-43) becomes:
```tsx
return (
  <AuthGate>
    <AuthModalProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg">
        Skip to content
      </a>
      <Navigation />
      <AnnouncementBanner />
      <main id="main-content" className="pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <AuthModal />
    </AuthModalProvider>
  </AuthGate>
)
```

Note: The chromeless branch (signin/signup/onboarding) does NOT need the AuthModalProvider — those pages handle auth themselves.

- [ ] **Step 4: Verify manually**

Run dev server. The app should still work normally — the modal context is wired but nothing triggers it yet. Verify no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-modal-context.tsx src/components/AuthModal.tsx src/components/LayoutShell.tsx
git commit -m "feat: add auth modal context and component"
```

---

### Task 4: Wire Follow Buttons to Auth Modal

**Files:**
- Modify: `src/components/FollowWrestlerButton.tsx`
- Modify: `src/components/FollowPromotionButton.tsx`
- Modify: `src/components/FollowProfessionalButton.tsx`

All three follow buttons use the identical pattern. For each file:

- [ ] **Step 1: Update FollowWrestlerButton**

In `src/components/FollowWrestlerButton.tsx`:

1. Remove the entire `useRouter` import line: `import { useRouter } from 'next/navigation'`
2. Remove: `const router = useRouter()` (line 22)
3. Add import: `import { useAuthModal } from '@/lib/auth-modal-context'`
4. Add inside component: `const { openAuthModal } = useAuthModal()`
5. Change the auth check in `handleFollow()` (lines 50-52):
```typescript
// was: router.push('/signin')
openAuthModal('Sign in to follow this wrestler')
```

- [ ] **Step 2: Update FollowPromotionButton**

In `src/components/FollowPromotionButton.tsx`:

Same pattern as Step 1:
- Remove `import { useRouter } from 'next/navigation'` line entirely
- Remove `const router = useRouter()`
- Add `useAuthModal` import and usage
- Change auth check: `openAuthModal('Sign in to follow this promotion')`

- [ ] **Step 3: Update FollowProfessionalButton**

In `src/components/FollowProfessionalButton.tsx`:

Same pattern as Step 1:
- Remove `import { useRouter } from 'next/navigation'` line entirely
- Remove `const router = useRouter()`
- Add `useAuthModal` import and usage
- Change auth check: `openAuthModal('Sign in to follow this person')`

- [ ] **Step 4: Verify manually**

Run dev server in incognito:
1. Go to any wrestler page (e.g., `/wrestlers/some-wrestler`) — click Follow → auth modal should appear
2. Go to any promotion page — click Follow → auth modal should appear
3. Go to any crew page — click Follow → auth modal should appear
4. Modal should show contextual message, Sign Up Free and Sign In buttons
5. Pressing Escape should close the modal
6. Clicking backdrop should close the modal
7. Sign Up link should include `?redirect=/wrestlers/some-wrestler`

- [ ] **Step 5: Commit**

```bash
git add src/components/FollowWrestlerButton.tsx src/components/FollowPromotionButton.tsx src/components/FollowProfessionalButton.tsx
git commit -m "feat: show auth modal on follow button clicks for logged-out users"
```

---

### Task 5: Wire Attendance Buttons to Auth Modal

**Files:**
- Modify: `src/components/AttendanceButtons.tsx`

- [ ] **Step 1: Update AttendanceButtons**

In `src/components/AttendanceButtons.tsx`:

1. Remove the entire `useRouter` import line: `import { useRouter } from 'next/navigation'`
2. Remove: `const router = useRouter()` (line 24)
3. Add import: `import { useAuthModal } from '@/lib/auth-modal-context'`
4. Add inside component: `const { openAuthModal } = useAuthModal()`
5. Change the auth check in `handleAttendance()` (lines 56-58):
```typescript
// was: router.push('/signin')
openAuthModal('Sign in to RSVP to this event')
```

- [ ] **Step 2: Verify manually**

Run dev server in incognito:
1. Go to any event page (e.g., `/events/some-event-id`)
2. Click "I'm Going" → auth modal should appear with "Sign in to RSVP to this event"
3. Click "Interested" → same modal
4. Modal Sign In link should include redirect back to the event page

- [ ] **Step 3: Commit**

```bash
git add src/components/AttendanceButtons.tsx
git commit -m "feat: show auth modal on attendance buttons for logged-out users"
```

---

### Task 6: Add Redirect Support to Sign-In Page

**Files:**
- Modify: `src/app/signin/page.tsx`

- [ ] **Step 1: Add redirect support to sign-in page**

In `src/app/signin/page.tsx`:

1. Add `useSearchParams` to imports and `Suspense` from React:
```typescript
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
```

2. Rename the existing `SignInPage` component to `SignInContent` (internal component).

3. Create a new default export that wraps `SignInContent` in `Suspense` (required by Next.js 14 for `useSearchParams`):
```tsx
export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
```

4. Inside `SignInContent`, read the redirect param with an open-redirect guard:
```typescript
const searchParams = useSearchParams()
const redirectParam = searchParams.get('redirect')
const redirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/'
```

5. Change `handleSubmit` success (line 44):
```typescript
// was: router.push('/')
router.push(redirect)
```

6. Update the "Don't have an account?" link to pass redirect through:
```tsx
<Link href={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-accent hover:underline">
  Sign up
</Link>
```

**Note:** Google OAuth sign-in (`handleGoogleSignIn`) goes through Supabase's OAuth flow which redirects to `/auth/callback`. The redirect param is not preserved through this flow. This is a known v1 limitation — Google OAuth users will land on `/` after sign-in regardless of the redirect param. Documented in the spec under "Deferred".

- [ ] **Step 2: Verify manually**

1. In incognito, go to `/wrestlers/some-wrestler` → click Follow → modal appears → click "Sign In"
2. URL should be `/signin?redirect=%2Fwrestlers%2Fsome-wrestler`
3. Sign in with valid credentials → should redirect back to the wrestler page, NOT to `/`

- [ ] **Step 3: Commit**

```bash
git add src/app/signin/page.tsx
git commit -m "feat: honor redirect query param after sign-in"
```

---

### Task 7: Build Verification

- [ ] **Step 1: Run production build**

```bash
cd src && npm run build
```

Verify no TypeScript errors or build failures.

- [ ] **Step 2: Run lint**

```bash
cd src && npm run lint
```

Fix any lint warnings from changed files.

- [ ] **Step 3: Final manual smoke test**

Checklist in incognito mode:
- [ ] `localhost:3000` shows full homepage with signup banner
- [ ] `/events`, `/wrestlers`, `/promotions`, `/crew`, `/map`, `/search` all accessible
- [ ] `/dashboard` redirects to `/signin`
- [ ] Follow buttons on wrestler/promotion/crew pages trigger auth modal
- [ ] Going/Interested buttons on event pages trigger auth modal
- [ ] Modal has proper focus trapping, Escape to close, backdrop click to close
- [ ] Sign In link in modal includes redirect param
- [ ] After signing in, user returns to the page they were on
- [ ] Signed-in users see no banner, Follow/Going buttons work normally

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: address build/lint issues from auth changes"
```
