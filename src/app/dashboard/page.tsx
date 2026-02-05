'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPromoterDashboardData, getUserClaims, createEvent, deleteEvent, type PromoterDashboardData } from '@/lib/promoter'
import {
  Loader2,
  Calendar,
  Users,
  Ticket,
  Building2,
  ExternalLink,
  Edit3,
  Clock,
  ShieldCheck,
  Shield,
  BarChart3,
  ArrowRight,
  Plus,
  Video,
  MapPin,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { formatEventDate, formatLocation } from '@/lib/utils'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<PromoterDashboardData | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPromotion, setHasPromotion] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Delete "${eventName}"? This cannot be undone.`)) return
    try {
      await deleteEvent(eventId)
      loadData() // Reload dashboard
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Failed to delete event. It may have attendance records or other linked data.')
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/signin')
      return
    }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    setLoading(true)
    
    // Try to get promoter dashboard data
    const data = await getPromoterDashboardData()
    if (data) {
      setDashboardData(data)
      setHasPromotion(true)
    } else {
      // No promotion claimed yet - show claims status
      const userClaims = await getUserClaims()
      setClaims(userClaims)
    }
    
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) return null

  // No promotion yet - show claims or prompt to claim
  if (!hasPromotion) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Promoter Dashboard</h1>
            <p className="text-foreground-muted">
              Manage your promotion's events, roster, and more.
            </p>
          </div>

          {claims.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Claims</h2>
              {claims.map((claim) => (
                <div key={claim.id} className="card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden">
                      {claim.promotions?.logo_url ? (
                        <Image
                          src={claim.promotions.logo_url}
                          alt={claim.promotions.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-foreground-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{claim.promotions?.name}</div>
                      <div className="text-sm text-foreground-muted">
                        Claimed as {claim.role_title || 'Representative'}
                      </div>
                    </div>
                    <div>
                      {claim.status === 'pending' && (
                        <span className="badge bg-interested/20 text-interested">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </span>
                      )}
                      {claim.status === 'approved' && (
                        <span className="badge bg-attending/20 text-attending">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      )}
                      {claim.status === 'rejected' && (
                        <span className="badge bg-red-500/20 text-red-400">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  {claim.status === 'rejected' && claim.admin_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-sm text-red-400">
                      {claim.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Shield className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Promotion Claimed</h2>
              <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                To access the promoter dashboard, you need to claim your promotion first. 
                Find your promotion and click "Claim This Promotion."
              </p>
              <Link href="/promotions" className="btn btn-primary">
                <Building2 className="w-4 h-4 mr-2" />
                Browse Promotions
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Has promotion - show full dashboard
  const { promotion, upcomingEvents, pastEvents, followerCount, totalAttending } = dashboardData!

  return (
    <div className="min-h-screen">
      {/* Dashboard Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-background-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
              {promotion.logo_url ? (
                <Image
                  src={promotion.logo_url}
                  alt={promotion.name}
                  width={56}
                  height={56}
                  className="object-contain p-1"
                />
              ) : (
                <Building2 className="w-7 h-7 text-foreground-muted" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{promotion.name}</h1>
                <ShieldCheck className="w-5 h-5 text-attending" />
              </div>
              <p className="text-sm text-foreground-muted">Promoter Dashboard</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/promotions/${promotion.slug}`}
                className="btn btn-ghost text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View Public Page
              </Link>
              <Link
                href="/dashboard/promotion"
                className="btn btn-secondary text-sm"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                <div className="text-xs text-foreground-muted">Upcoming Events</div>
              </div>
            </div>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-attending/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-attending" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalAttending}</div>
                <div className="text-xs text-foreground-muted">Total Attending</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-interested/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-interested" />
              </div>
              <div>
                <div className="text-2xl font-bold">{followerCount}</div>
                <div className="text-xs text-foreground-muted">Followers</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pastEvents.length}</div>
                <div className="text-xs text-foreground-muted">Past Events</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Upcoming Events</h2>
            <button onClick={() => setShowAddEvent(true)} className="btn btn-primary text-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Event
            </button>
          </div>

          {/* Add Event Modal */}
          {showAddEvent && (
            <AddEventModal
              promotionId={promotion.id}
              onCreated={(newEvent) => {
                setShowAddEvent(false)
                router.push(`/dashboard/events/${newEvent.id}`)
              }}
              onClose={() => setShowAddEvent(false)}
            />
          )}

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => {
                const hasTickets = !!event.ticket_url
                const hasStreaming = !!event.streaming_url
                const hasPoster = !!event.poster_url
                
                return (
                  <div key={event.id} className="card p-4">
                    <div className="flex items-center gap-4">
                      {/* Date block */}
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className="text-accent font-bold text-sm">
                          {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold">
                          {new Date(event.event_date + 'T00:00:00').getDate()}
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{event.name}</div>
                        <div className="text-sm text-foreground-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formatLocation(event.city, event.state)}
                          {event.venue_name && ` · ${event.venue_name}`}
                        </div>
                        {/* Status badges */}
                        <div className="flex gap-2 mt-1.5">
                          {hasTickets ? (
                            <span className="inline-flex items-center text-xs text-attending">
                              <Ticket className="w-3 h-3 mr-0.5" /> Tickets ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-foreground-muted/50">
                              <Ticket className="w-3 h-3 mr-0.5" /> No tickets
                            </span>
                          )}
                          {hasStreaming ? (
                            <span className="inline-flex items-center text-xs text-attending">
                              <Video className="w-3 h-3 mr-0.5" /> Streaming ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-foreground-muted/50">
                              <Video className="w-3 h-3 mr-0.5" /> No stream
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="btn btn-secondary text-sm"
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          Manage
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Calendar className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-foreground-muted">No upcoming events found.</p>
              <p className="text-sm text-foreground-muted/70 mt-1">
                Events from Cagematch and other sources will appear here automatically.
              </p>
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-display font-bold mb-4 text-foreground-muted">
              Past Events
            </h2>
            <div className="space-y-2 opacity-60">
              {pastEvents.slice(0, 5).map((event: any) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="card p-3 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-12 text-center text-sm">
                    <div className="text-foreground-muted font-bold">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-lg font-bold">
                      {new Date(event.event_date + 'T00:00:00').getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{event.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {formatLocation(event.city, event.state)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// ADD EVENT MODAL
// ============================================

function AddEventModal({ promotionId, onCreated, onClose }: {
  promotionId: string
  onCreated: (event: any) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [doorsTime, setDoorsTime] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !eventDate) return
    setCreating(true)
    setError('')
    try {
      const event = await createEvent({
        name,
        event_date: eventDate,
        promotion_id: promotionId,
        venue_name: venueName || undefined,
        city: city || undefined,
        state: state || undefined,
        event_time: eventTime || undefined,
        doors_time: doorsTime || undefined,
        is_free: isFree,
      })
      onCreated(event)
    } catch (err: any) {
      setError(err?.message || 'Failed to create event.')
    }
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background-secondary rounded-2xl border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-display font-bold">Add New Event</h2>
            <p className="text-sm text-foreground-muted mt-1">Create a new event for your promotion</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-tertiary transition-colors" disabled={creating}>
            <AlertCircle className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Event Name <span className="text-red-400">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g., "Chaos Theory 2026"'
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Event Date <span className="text-red-400">*</span></label>
            <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Venue Name</label>
            <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="White Eagle Hall, American Legion Post..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX"
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Doors Time</label>
              <input type="time" value={doorsTime} onChange={(e) => setDoorsTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bell Time</label>
              <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-accent" />
            <span className="text-sm">Free event</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1" disabled={creating}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={creating}>
              {creating ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4 mr-1.5" /> Create Event</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
