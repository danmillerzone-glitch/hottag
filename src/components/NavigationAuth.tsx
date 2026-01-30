'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  Flame, 
  Calendar, 
  Map, 
  Users, 
  Building2, 
  Search,
  User,
  LogOut,
  Loader2
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/wrestlers', label: 'Wrestlers', icon: Users },
  { href: '/promotions', label: 'Promotions', icon: Building2 },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-accent" />
              <span className="font-display font-bold text-xl">HotTag</span>
            </Link>

            {/* Nav Links */}
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
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm max-w-[150px] truncate">
                      {user.email}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-background-secondary border border-border rounded-lg shadow-lg py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm hover:bg-background-tertiary transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-background-tertiary transition-colors text-red-400 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="btn btn-primary"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  isActive ? 'text-accent' : 'text-foreground-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <Link
            href={user ? '/profile' : '/signin'}
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              pathname === '/profile' || pathname === '/signin' ? 'text-accent' : 'text-foreground-muted'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">{user ? 'Profile' : 'Sign In'}</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
