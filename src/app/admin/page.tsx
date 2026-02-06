'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  checkIsAdmin, getAdminStats,
  getPendingPromotionClaims, getPendingWrestlerClaims,
  getAllPromotionClaims, getAllWrestlerClaims,
  approvePromotionClaim, rejectPromotionClaim,
  approveWrestlerClaim, rejectWrestlerClaim,
  searchEvents, searchPromotions, searchWrestlersAdmin,
  deleteEvent, deleteWrestler, updateEventStatus,
} from '@/lib/admin'
import {
  Shield, BarChart3, CheckCircle, XCircle, Clock, Users,
  Building2, Calendar, Search, Trash2, ExternalLink,
  AlertTriangle, Loader2, User, ChevronDown, Award,
} from 'lucide-react'

type Tab = 'overview' | 'promo-claims' | 'wrestler-claims' | 'events' | 'promotions' | 'wrestlers'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/signin'); return }
    checkIsAdmin().then((admin) => {
      setIsAdmin(admin)
      setChecking(false)
      if (!admin) router.push('/')
    })
  }, [user, authLoading])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!isAdmin) return null

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'promo-claims', label: 'Promotion Claims', icon: Building2 },
    { id: 'wrestler-claims', label: 'Wrestler Claims', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'promotions', label: 'Promotions', icon: Building2 },
    { id: 'wrestlers', label: 'Wrestlers', icon: Award },
  ]

  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
              <p className="text-sm text-foreground-muted">Manage HotTag platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'bg-background-tertiary text-foreground-muted hover:text-foreground hover:bg-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'promo-claims' && <PromoClaimsTab />}
        {activeTab === 'wrestler-claims' && <WrestlerClaimsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'promotions' && <PromotionsTab />}
        {activeTab === 'wrestlers' && <WrestlersTab />}
      </div>
    </div>
  )
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>

  const cards = [
    { label: 'Events', value: stats.totalEvents, icon: Calendar, color: 'text-blue-400' },
    { label: 'Promotions', value: stats.totalPromotions, icon: Building2, color: 'text-green-400' },
    { label: 'Wrestlers', value: stats.totalWrestlers, icon: Users, color: 'text-purple-400' },
    { label: 'Pending Promo Claims', value: stats.pendingPromoClaims, icon: Clock, color: stats.pendingPromoClaims > 0 ? 'text-yellow-400' : 'text-foreground-muted' },
    { label: 'Pending Wrestler Claims', value: stats.pendingWrestlerClaims, icon: Clock, color: stats.pendingWrestlerClaims > 0 ? 'text-yellow-400' : 'text-foreground-muted' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-sm text-foreground-muted">{card.label}</span>
            </div>
            <div className="text-3xl font-display font-bold">{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// PROMOTION CLAIMS TAB
// ============================================

function PromoClaimsTab() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { loadClaims() }, [showAll])

  async function loadClaims() {
    setLoading(true)
    const data = showAll ? await getAllPromotionClaims() : await getPendingPromotionClaims()
    setClaims(data)
    setLoading(false)
  }

  async function handleApprove(claimId: string) {
    if (!confirm('Approve this claim? The user will gain control of the promotion page.')) return
    setProcessing(claimId)
    try {
      await approvePromotionClaim(claimId)
      await loadClaims()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setProcessing(null)
  }

  async function handleReject(claimId: string) {
    const notes = prompt('Rejection reason (optional):')
    if (notes === null) return
    setProcessing(claimId)
    try {
      await rejectPromotionClaim(claimId, notes)
      await loadClaims()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setProcessing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Promotion Claims</h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="btn btn-ghost text-sm"
        >
          {showAll ? 'Show Pending Only' : 'Show All Claims'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : claims.length === 0 ? (
        <div className="card p-8 text-center text-foreground-muted">
          {showAll ? 'No claims found.' : 'No pending promotion claims.'}
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/promotions/${claim.promotions?.slug}`}
                      className="font-semibold text-accent hover:underline"
                      target="_blank"
                    >
                      {claim.promotions?.name || 'Unknown Promotion'}
                    </Link>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="text-sm text-foreground-muted space-y-0.5">
                    <p><span className="font-medium">Contact:</span> {claim.contact_name} ({claim.user_email})</p>
                    {claim.role_title && <p><span className="font-medium">Role:</span> {claim.role_title}</p>}
                    {claim.proof_description && <p><span className="font-medium">Proof:</span> {claim.proof_description}</p>}
                    {claim.website_or_social && <p><span className="font-medium">Link:</span> <a href={claim.website_or_social} target="_blank" className="text-accent hover:underline">{claim.website_or_social}</a></p>}
                    <p className="text-xs text-foreground-muted/60">Submitted {new Date(claim.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {claim.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={processing === claim.id}
                      className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                    >
                      {processing === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                    </button>
                    <button
                      onClick={() => handleReject(claim.id)}
                      disabled={processing === claim.id}
                      className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// WRESTLER CLAIMS TAB
// ============================================

function WrestlerClaimsTab() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { loadClaims() }, [showAll])

  async function loadClaims() {
    setLoading(true)
    const data = showAll ? await getAllWrestlerClaims() : await getPendingWrestlerClaims()
    setClaims(data)
    setLoading(false)
  }

  async function handleApprove(claimId: string) {
    if (!confirm('Approve this claim? The user will gain control of the wrestler profile.')) return
    setProcessing(claimId)
    try {
      await approveWrestlerClaim(claimId)
      await loadClaims()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setProcessing(null)
  }

  async function handleReject(claimId: string) {
    const notes = prompt('Rejection reason (optional):')
    if (notes === null) return
    setProcessing(claimId)
    try {
      await rejectWrestlerClaim(claimId, notes)
      await loadClaims()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setProcessing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Wrestler Claims</h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="btn btn-ghost text-sm"
        >
          {showAll ? 'Show Pending Only' : 'Show All Claims'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : claims.length === 0 ? (
        <div className="card p-8 text-center text-foreground-muted">
          {showAll ? 'No claims found.' : 'No pending wrestler claims.'}
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/wrestlers/${claim.wrestlers?.slug}`}
                      className="font-semibold text-accent hover:underline"
                      target="_blank"
                    >
                      {claim.wrestlers?.name || 'Unknown Wrestler'}
                    </Link>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="text-sm text-foreground-muted space-y-0.5">
                    <p><span className="font-medium">Contact:</span> {claim.contact_name} ({claim.user_email})</p>
                    {claim.ring_name && <p><span className="font-medium">Ring Name:</span> {claim.ring_name}</p>}
                    {claim.proof_description && <p><span className="font-medium">Verification:</span> {claim.proof_description}</p>}
                    {claim.website_or_social && <p><span className="font-medium">Link:</span> <a href={claim.website_or_social} target="_blank" className="text-accent hover:underline">{claim.website_or_social}</a></p>}
                    <p className="text-xs text-foreground-muted/60">Submitted {new Date(claim.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {claim.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={processing === claim.id}
                      className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                    >
                      {processing === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                    </button>
                    <button
                      onClick={() => handleReject(claim.id)}
                      disabled={processing === claim.id}
                      className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// EVENTS TAB
// ============================================

function EventsTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchEvents(query)
    setResults(data)
    setLoading(false)
  }

  async function handleDelete(eventId: string, eventName: string) {
    if (!confirm(`Delete "${eventName}"? This cannot be undone.`)) return
    try {
      await deleteEvent(eventId)
      setResults(results.filter(e => e.id !== eventId))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  async function handleStatusChange(eventId: string, newStatus: string) {
    try {
      await updateEventStatus(eventId, newStatus)
      setResults(results.map(e => e.id === eventId ? { ...e, status: newStatus } : e))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Events</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search events by name..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
        <button onClick={handleSearch} disabled={loading} className="btn btn-primary px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" /> Search</>}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((event) => (
            <div key={event.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/events/${event.id}`} target="_blank" className="font-semibold text-accent hover:underline truncate">
                    {event.name}
                  </Link>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-sm text-foreground-muted">
                  {event.event_date} • {event.promotions?.name} • {event.city}, {event.state}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={event.status}
                  onChange={(e) => handleStatusChange(event.id, e.target.value)}
                  className="text-xs bg-background-tertiary border border-border rounded px-2 py-1 text-foreground"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => handleDelete(event.id, event.name)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// PROMOTIONS TAB
// ============================================

function PromotionsTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchPromotions(query)
    setResults(data)
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Promotions</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search promotions by name..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
        <button onClick={handleSearch} disabled={loading} className="btn btn-primary px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" /> Search</>}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((promo) => (
            <div key={promo.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/promotions/${promo.slug}`} target="_blank" className="font-semibold text-accent hover:underline">
                    {promo.name}
                  </Link>
                  {promo.verification_status === 'verified' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verified</span>
                  )}
                </div>
                <p className="text-sm text-foreground-muted">
                  {promo.city && promo.state ? `${promo.city}, ${promo.state}` : 'No location'} 
                  {promo.claimed_by ? ' • Claimed' : ' • Unclaimed'}
                </p>
              </div>
              <Link
                href={`/promotions/${promo.slug}`}
                target="_blank"
                className="btn btn-ghost text-sm flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// WRESTLERS TAB
// ============================================

function WrestlersTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchWrestlersAdmin(query)
    setResults(data)
    setLoading(false)
  }

  async function handleDelete(wrestlerId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteWrestler(wrestlerId)
      setResults(results.filter(w => w.id !== wrestlerId))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Wrestlers</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search wrestlers by name..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />
        <button onClick={handleSearch} disabled={loading} className="btn btn-primary px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" /> Search</>}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((wrestler) => (
            <div key={wrestler.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/wrestlers/${wrestler.slug}`} target="_blank" className="font-semibold text-accent hover:underline">
                    {wrestler.name}
                  </Link>
                  {wrestler.pwi_ranking && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      PWI #{wrestler.pwi_ranking}
                    </span>
                  )}
                  {wrestler.verification_status === 'verified' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verified</span>
                  )}
                </div>
                <p className="text-sm text-foreground-muted">
                  {wrestler.claimed_by ? 'Claimed' : 'Unclaimed'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/wrestlers/${wrestler.slug}`}
                  target="_blank"
                  className="btn btn-ghost text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> View
                </Link>
                <button
                  onClick={() => handleDelete(wrestler.id, wrestler.name)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  title="Delete wrestler"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// SHARED COMPONENTS
// ============================================

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    upcoming: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-foreground-muted/20 text-foreground-muted',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-background-tertiary text-foreground-muted'}`}>
      {status}
    </span>
  )
}
