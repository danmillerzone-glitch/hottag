'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getTodayHawaii } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Ticket,
  Heart,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react'

interface EventStats {
  id: string
  name: string
  event_date: string
  attending_count: number
  interested_count: number
  real_attending_count: number
  real_interested_count: number
  ticket_url: string | null
  poster_url: string | null
}

interface PromoterAnalyticsProps {
  promotionId: string
}

export default function PromoterAnalytics({ promotionId }: PromoterAnalyticsProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [eventStats, setEventStats] = useState<EventStats[]>([])
  const [totalPastAttending, setTotalPastAttending] = useState(0)
  const [totalPastInterested, setTotalPastInterested] = useState(0)
  const [recentFollowers, setRecentFollowers] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [promotionId])

  async function fetchAnalytics() {
    setLoading(true)
    const today = getTodayHawaii()

    // Fetch all events with their attendance counts
    const [upcomingRes, pastRes, followersRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, name, event_date, attending_count, interested_count, real_attending_count, real_interested_count, ticket_url, poster_url')
        .eq('promotion_id', promotionId)
        .gte('event_date', today)
        .order('event_date', { ascending: true }),
      supabase
        .from('events')
        .select('id, name, event_date, attending_count, interested_count, real_attending_count, real_interested_count, ticket_url, poster_url')
        .eq('promotion_id', promotionId)
        .lt('event_date', today)
        .order('event_date', { ascending: false })
        .limit(10),
      // Followers gained in last 30 days
      supabase
        .from('user_follows_promotion')
        .select('id', { count: 'exact', head: true })
        .eq('promotion_id', promotionId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const upcomingEvents = (upcomingRes.data || []).map((e: any) => ({
      ...e,
      attending_count: e.real_attending_count || e.attending_count || 0,
      interested_count: e.real_interested_count || e.interested_count || 0,
    }))

    const pastEventsData = (pastRes.data || []).map((e: any) => ({
      ...e,
      attending_count: e.real_attending_count || e.attending_count || 0,
      interested_count: e.real_interested_count || e.interested_count || 0,
    }))

    setEventStats([...upcomingEvents, ...pastEventsData])

    setTotalPastAttending(pastEventsData.reduce((sum: number, e: any) => sum + e.attending_count, 0))
    setTotalPastInterested(pastEventsData.reduce((sum: number, e: any) => sum + e.interested_count, 0))
    setRecentFollowers(followersRes.count || 0)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-display font-bold">Analytics</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </div>
    )
  }

  const today = getTodayHawaii()
  const upcomingStats = eventStats.filter(e => e.event_date >= today)
  const pastStats = eventStats.filter(e => e.event_date < today)

  // Find best performing upcoming event
  const bestUpcoming = upcomingStats.length > 0
    ? upcomingStats.reduce((best, e) =>
        (e.attending_count + e.interested_count) > (best.attending_count + best.interested_count) ? e : best
      )
    : null

  // Average attendance per past event
  const avgAttending = pastStats.length > 0
    ? Math.round(totalPastAttending / pastStats.length)
    : 0

  return (
    <div className="card p-6 mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-display font-bold">Analytics</h2>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-foreground-muted" /> : <ChevronDown className="w-5 h-5 text-foreground-muted" />}
      </button>

      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Quick insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background-tertiary">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-foreground-muted">New Followers (30d)</span>
              </div>
              <div className="text-xl font-bold">{recentFollowers}</div>
            </div>

            <div className="p-4 rounded-lg bg-background-tertiary">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-xs text-foreground-muted">Avg Attending / Event</span>
              </div>
              <div className="text-xl font-bold">{avgAttending}</div>
            </div>

            <div className="p-4 rounded-lg bg-background-tertiary">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-interested" />
                <span className="text-xs text-foreground-muted">Total Past Interest</span>
              </div>
              <div className="text-xl font-bold">{totalPastAttending + totalPastInterested}</div>
            </div>
          </div>

          {/* Best performing upcoming event */}
          {bestUpcoming && upcomingStats.length > 1 && (
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="text-xs text-green-400 font-semibold mb-1">TOP PERFORMING EVENT</div>
              <div className="font-semibold">{bestUpcoming.name}</div>
              <div className="text-sm text-foreground-muted mt-1">
                <span className="text-green-400 font-semibold">{bestUpcoming.attending_count}</span> going
                {' · '}
                <span className="text-pink-400 font-semibold">{bestUpcoming.interested_count}</span> interested
              </div>
            </div>
          )}

          {/* Per-event breakdown */}
          {upcomingStats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">Upcoming Event Breakdown</h3>
              <div className="space-y-2">
                {upcomingStats.map(event => {
                  const total = event.attending_count + event.interested_count
                  const maxTotal = Math.max(...upcomingStats.map(e => e.attending_count + e.interested_count), 1)
                  const barWidth = Math.max((total / maxTotal) * 100, 2)

                  return (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{event.name}</div>
                        <div className="text-xs text-foreground-muted">
                          {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="w-32 sm:w-48">
                        <div className="flex h-5 rounded overflow-hidden bg-background">
                          <div
                            className="bg-green-500/60 transition-all duration-500"
                            style={{ width: `${total > 0 ? (event.attending_count / total) * barWidth : 0}%` }}
                          />
                          <div
                            className="bg-pink-500/60 transition-all duration-500"
                            style={{ width: `${total > 0 ? (event.interested_count / total) * barWidth : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-right w-20 flex-shrink-0">
                        <span className="text-green-400">{event.attending_count}</span>
                        {' / '}
                        <span className="text-pink-400">{event.interested_count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-foreground-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/60" /> Going</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-pink-500/60" /> Interested</span>
              </div>
            </div>
          )}

          {/* Completeness checklist */}
          {upcomingStats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">Event Completeness</h3>
              <div className="space-y-2">
                {upcomingStats.map(event => {
                  const hasTickets = !!event.ticket_url
                  const hasPoster = !!event.poster_url
                  const score = [hasTickets, hasPoster].filter(Boolean).length

                  return (
                    <div key={event.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0 truncate">{event.name}</div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-0.5 text-xs ${hasPoster ? 'text-green-400' : 'text-foreground-muted/40'}`}>
                          {hasPoster ? <Check className="w-3 h-3" /> : '—'} Poster
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-xs ${hasTickets ? 'text-green-400' : 'text-foreground-muted/40'}`}>
                          {hasTickets ? <Check className="w-3 h-3" /> : '—'} Tickets
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past event performance */}
          {pastStats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted mb-3">Recent Past Events</h3>
              <div className="space-y-2">
                {pastStats.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center gap-3 opacity-70">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{event.name}</div>
                      <div className="text-xs text-foreground-muted">
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-xs text-right flex-shrink-0">
                      <span className="text-green-400">{event.attending_count}</span> went
                      {' · '}
                      <span className="text-pink-400">{event.interested_count}</span> interested
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
