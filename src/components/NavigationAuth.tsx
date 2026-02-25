'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  Flame, Calendar, Map, Users, Building2, Search,
  User, LogOut, Loader2, Shield, Home, X, Briefcase, Star
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/wrestlers', label: 'Wrestlers', icon: Users },
  { href: '/promotions', label: 'Promotions', icon: Building2 },
  { href: '/crew', label: 'Crew', icon: Briefcase },
]

// Show Vegas Weekend nav item until end of April 19, 2026
const VEGAS_WEEKEND_END = new Date('2026-04-21T06:00:00Z') // April 21 6AM UTC = April 20 11PM PT

function useShowVegasWeekend() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(new Date() < VEGAS_WEEKEND_END)
  }, [])
  return show
}

export default function Navigation() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [hasPromotion, setHasPromotion] = useState(false)
  const [hasWrestler, setHasWrestler] = useState(false)
  const [hasProfessional, setHasProfessional] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showVegas = useShowVegasWeekend()

  useEffect(() => {
    if (!user) {
      setHasPromotion(false)
      setHasWrestler(false)
      setHasProfessional(false)
      setIsAdmin(false)
      return
    }
    const supabase = createClient()

    // Fire all role-check queries in parallel instead of sequentially
    Promise.all([
      supabase.from('promotions').select('id').eq('claimed_by', user.id).limit(1),
      supabase.from('wrestlers').select('id').eq('claimed_by', user.id).limit(1),
      supabase.from('professionals').select('id').eq('claimed_by', user.id).limit(1),
      supabase.from('admin_users').select('user_id').eq('user_id', user.id).limit(1),
    ]).then(([promoRes, wrestlerRes, professionalRes, adminRes]) => {
      setHasPromotion(!!(promoRes.data && promoRes.data.length > 0))
      setHasWrestler(!!(wrestlerRes.data && wrestlerRes.data.length > 0))
      setHasProfessional(!!(professionalRes.data && professionalRes.data.length > 0))
      setIsAdmin(!!(adminRes.data && adminRes.data.length > 0))
    })
  }, [user])

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false)
    setShowDropdown(false)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
    setShowMobileMenu(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-accent" />
              <span className="font-display font-bold text-xl">Hot Tag</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              {showVegas && (
                <Link
                  href="/vegas-weekend"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                    pathname === '/vegas-weekend'
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'text-yellow-400 hover:bg-yellow-500/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Vegas Weekend
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/search"
                aria-label="Search"
                className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Link>

              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-expanded={showDropdown}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm max-w-[150px] truncate">
                      {user.email}
                    </span>
                  </button>

                  {showDropdown && (
                    <div role="menu" className="absolute right-0 mt-2 w-48 bg-background-secondary border border-border rounded-lg shadow-lg py-1">
                      {hasPromotion && (
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background-tertiary transition-colors" onClick={() => setShowDropdown(false)}>
                          <Building2 className="w-4 h-4 text-accent" />
                          <span className="text-accent font-medium">Promoter Dashboard</span>
                        </Link>
                      )}
                      {hasWrestler && (
                        <Link href="/dashboard/wrestler" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background-tertiary transition-colors" onClick={() => setShowDropdown(false)}>
                          <Users className="w-4 h-4 text-accent" />
                          <span className="text-accent font-medium">Wrestler Dashboard</span>
                        </Link>
                      )}
                      {hasProfessional && (
                        <Link href="/dashboard/professional" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background-tertiary transition-colors" onClick={() => setShowDropdown(false)}>
                          <Briefcase className="w-4 h-4 text-accent" />
                          <span className="text-accent font-medium">Crew Dashboard</span>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background-tertiary transition-colors" onClick={() => setShowDropdown(false)}>
                          <Shield className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">Admin Panel</span>
                        </Link>
                      )}
                      {(hasPromotion || hasWrestler || hasProfessional || isAdmin) && <div className="border-t border-border my-1" />}
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background-tertiary transition-colors" onClick={() => setShowDropdown(false)}>
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-background-tertiary transition-colors text-red-400 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/signin" className="btn btn-primary">
                  <User className="w-4 h-4 mr-2" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent" />
            <span className="text-lg font-display font-bold">Hot Tag</span>
          </Link>
          <div className="flex items-center gap-2">
            {showVegas && (
              <Link
                href="/vegas-weekend"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  pathname === '/vegas-weekend'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                }`}
              >
                <Star className="w-3 h-3" />
                Vegas
              </Link>
            )}
            <Link href="/search" aria-label="Search" className="p-2 rounded-lg text-foreground-muted hover:text-foreground">
              <Search className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/' ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            href="/events"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/events' || pathname.startsWith('/events/') ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Events</span>
          </Link>
          <Link
            href="/map"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/map' ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px]">Map</span>
          </Link>
          <Link
            href="/wrestlers"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/wrestlers' || pathname.startsWith('/wrestlers/') ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Wrestlers</span>
          </Link>
          <Link
            href="/promotions"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/promotions' || pathname.startsWith('/promotions/') ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px]">Promos</span>
          </Link>
          <button
            onClick={() => setShowMobileMenu(true)}
            aria-label={user ? 'Open account menu' : 'Sign in'}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              pathname === '/profile' || pathname.startsWith('/dashboard') ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">{user ? 'You' : 'Sign In'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Profile/Menu Slide-up */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" role="presentation" onClick={() => setShowMobileMenu(false)} />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-background-secondary rounded-t-2xl border-t border-border p-5 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg">
                {user ? 'Account' : 'Sign In'}
              </h3>
              <button onClick={() => setShowMobileMenu(false)} aria-label="Close menu" className="p-1 rounded-lg hover:bg-background-tertiary">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 mb-3">
                  <p className="text-sm text-foreground-muted truncate">{user.email}</p>
                </div>
                {hasPromotion && (
                  <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors">
                    <Building2 className="w-5 h-5 text-accent" />
                    <span className="text-accent font-medium">Promoter Dashboard</span>
                  </Link>
                )}
                {hasWrestler && (
                  <Link href="/dashboard/wrestler" onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors">
                    <Users className="w-5 h-5 text-accent" />
                    <span className="text-accent font-medium">Wrestler Dashboard</span>
                  </Link>
                )}
                {hasProfessional && (
                  <Link href="/dashboard/professional" onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors">
                    <Briefcase className="w-5 h-5 text-accent" />
                    <span className="text-accent font-medium">Crew Dashboard</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Admin Panel</span>
                  </Link>
                )}
                {(hasPromotion || hasWrestler || hasProfessional || isAdmin) && <div className="border-t border-border my-2" />}
                <Link href="/profile" onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-background-tertiary transition-colors text-red-400">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/signin" onClick={() => setShowMobileMenu(false)} className="btn btn-primary w-full justify-center">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setShowMobileMenu(false)} className="btn btn-secondary w-full justify-center">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
