'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Calendar, 
  Map, 
  Users, 
  Building2,
  Search,
  User,
  Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Events', icon: Calendar },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/wrestlers', label: 'Wrestlers', icon: Users },
  { href: '/promotions', label: 'Promotions', icon: Building2 },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-accent" />
              <span className="text-xl font-display font-bold">Hot Tag</span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-background-tertiary text-foreground'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
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
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors">
                <User className="w-4 h-4" />
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-secondary/95 backdrop-blur border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                  isActive
                    ? 'text-accent'
                    : 'text-foreground-muted'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          <Link
            href="/profile"
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
              pathname === '/profile'
                ? 'text-accent'
                : 'text-foreground-muted'
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent" />
            <span className="text-lg font-display font-bold">Hot Tag</span>
          </Link>
          <button className="p-2 rounded-lg text-foreground-muted hover:text-foreground">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>
    </>
  )
}
