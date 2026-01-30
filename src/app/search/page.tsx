'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search as SearchIcon, 
  Calendar, 
  Users, 
  Building2, 
  MapPin,
  User,
  Loader2,
  X
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

interface SearchResult {
  type: 'event' | 'wrestler' | 'promotion'
  id: string
  name: string
  slug: string
  subtitle?: string
  image?: string | null
  date?: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'wrestlers' | 'promotions'>('all')
  
  const supabase = createClient()

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      const searchTerm = `%${searchQuery}%`
      const allResults: SearchResult[] = []

      // Search events
      const { data: events } = await supabase
        .from('events')
        .select(`
          id,
          name,
          event_date,
          city,
          state,
          promotions (name)
        `)
        .ilike('name', searchTerm)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(20)

      if (events) {
        events.forEach((e: any) => {
          allResults.push({
            type: 'event',
            id: e.id,
            name: e.name,
            slug: e.id,
            subtitle: `${e.promotions?.name || ''} • ${e.city}${e.state ? `, ${e.state}` : ''}`,
            date: e.event_date,
          })
        })
      }

      // Search wrestlers
      const { data: wrestlers } = await supabase
        .from('wrestlers')
        .select('id, name, slug, photo_url, hometown')
        .ilike('name', searchTerm)
        .limit(20)

      if (wrestlers) {
        wrestlers.forEach((w: any) => {
          allResults.push({
            type: 'wrestler',
            id: w.id,
            name: w.name,
            slug: w.slug,
            subtitle: w.hometown || undefined,
            image: w.photo_url,
          })
        })
      }

      // Search promotions
      const { data: promotions } = await supabase
        .from('promotions')
        .select('id, name, slug, logo_url, city, state')
        .ilike('name', searchTerm)
        .limit(20)

      if (promotions) {
        promotions.forEach((p: any) => {
          allResults.push({
            type: 'promotion',
            id: p.id,
            name: p.name,
            slug: p.slug,
            subtitle: p.city && p.state ? `${p.city}, ${p.state}` : undefined,
            image: p.logo_url,
          })
        })
      }

      setResults(allResults)
    } catch (error) {
      console.error('Search error:', error)
    }

    setLoading(false)
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
      // Update URL
      if (query) {
        router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
      } else {
        router.replace('/search', { scroll: false })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch, router])

  // Initial search from URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab.slice(0, -1) as any || r.type === activeTab.replace(/s$/, ''))

  const eventCount = results.filter(r => r.type === 'event').length
  const wrestlerCount = results.filter(r => r.type === 'wrestler').length
  const promotionCount = results.filter(r => r.type === 'promotion').length

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, wrestlers, promotions..."
            className="w-full pl-12 pr-12 py-4 text-lg rounded-xl bg-background-secondary border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background-tertiary"
            >
              <X className="w-5 h-5 text-foreground-muted" />
            </button>
          )}
        </div>

        {/* Tabs */}
        {results.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Events ({eventCount})
            </button>
            <button
              onClick={() => setActiveTab('wrestlers')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === 'wrestlers'
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              <Users className="w-4 h-4" />
              Wrestlers ({wrestlerCount})
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === 'promotions'
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Promotions ({promotionCount})
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Results */}
        {!loading && query.length >= 2 && (
          <div className="space-y-3">
            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-foreground-muted">
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={
                    result.type === 'event' 
                      ? `/events/${result.slug}`
                      : result.type === 'wrestler'
                      ? `/wrestlers/${result.slug}`
                      : `/promotions/${result.slug}`
                  }
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  {/* Icon/Image */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                    result.type === 'event' ? 'bg-accent/20' :
                    result.type === 'wrestler' ? 'bg-background rounded-full' :
                    'bg-background-tertiary'
                  }`}>
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt={result.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : result.type === 'event' ? (
                      <Calendar className="w-6 h-6 text-accent" />
                    ) : result.type === 'wrestler' ? (
                      <User className="w-6 h-6 text-foreground-muted" />
                    ) : (
                      <Building2 className="w-6 h-6 text-foreground-muted" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{result.name}</div>
                    {result.subtitle && (
                      <div className="text-sm text-foreground-muted truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Date for events */}
                  {result.type === 'event' && result.date && (
                    <div className="text-sm text-accent font-medium">
                      {formatDate(result.date)}
                    </div>
                  )}

                  {/* Type badge */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.type === 'event' ? 'bg-accent/20 text-accent' :
                    result.type === 'wrestler' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {result.type}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && query.length < 2 && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">Search HotTag</h2>
            <p className="text-foreground-muted">
              Find events, wrestlers, and promotions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
