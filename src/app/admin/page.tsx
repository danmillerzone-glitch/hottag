'use client'

import { useState, useEffect, useRef } from 'react'
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
  getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
  banUser, unbanUser, getBannedUsers,
  updateWrestlerAdmin, updatePromotionAdmin, updateEventAdmin,
  getWrestlerFull, getPromotionFull, getEventFull,
  verifyWrestler, unverifyWrestler, verifyPromotion, unverifyPromotion,
  mergeWrestlers,
  bulkImportEvents, getAllPromotionsList,
} from '@/lib/admin'
import {
  Shield, BarChart3, CheckCircle, XCircle, Clock, Users,
  Building2, Calendar, Search, Trash2, ExternalLink,
  AlertTriangle, Loader2, User, Award, Megaphone,
  Ban, UserCheck, Edit3, GitMerge, Upload, Eye, EyeOff,
  Plus, Save, X, BadgeCheck,
} from 'lucide-react'

type Tab = 'overview' | 'promo-claims' | 'wrestler-claims' | 'events' | 'promotions' | 'wrestlers' | 'announcements' | 'users' | 'merge' | 'import'

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
    { id: 'promo-claims', label: 'Promo Claims', icon: Building2 },
    { id: 'wrestler-claims', label: 'Wrestler Claims', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'promotions', label: 'Promotions', icon: Building2 },
    { id: 'wrestlers', label: 'Wrestlers', icon: Award },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'users', label: 'Users & Bans', icon: Ban },
    { id: 'merge', label: 'Merge', icon: GitMerge },
    { id: 'import', label: 'Bulk Import', icon: Upload },
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'promo-claims' && <PromoClaimsTab />}
        {activeTab === 'wrestler-claims' && <WrestlerClaimsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'promotions' && <PromotionsTab />}
        {activeTab === 'wrestlers' && <WrestlersTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'merge' && <MergeTab />}
        {activeTab === 'import' && <ImportTab />}
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

  if (loading) return <LoadingSpinner />

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
    try { await approvePromotionClaim(claimId); await loadClaims() }
    catch (err: any) { alert(`Error: ${err.message}`) }
    setProcessing(null)
  }

  async function handleReject(claimId: string) {
    const notes = prompt('Rejection reason (optional):')
    if (notes === null) return
    setProcessing(claimId)
    try { await rejectPromotionClaim(claimId, notes); await loadClaims() }
    catch (err: any) { alert(`Error: ${err.message}`) }
    setProcessing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Promotion Claims</h2>
        <button onClick={() => setShowAll(!showAll)} className="btn btn-ghost text-sm">
          {showAll ? 'Show Pending Only' : 'Show All Claims'}
        </button>
      </div>

      {loading ? <LoadingSpinner /> : claims.length === 0 ? (
        <EmptyState text={showAll ? 'No claims found.' : 'No pending promotion claims.'} />
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/promotions/${claim.promotions?.slug}`} className="font-semibold text-accent hover:underline" target="_blank">
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
                    <button onClick={() => handleApprove(claim.id)} disabled={processing === claim.id} className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                      {processing === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                    </button>
                    <button onClick={() => handleReject(claim.id)} disabled={processing === claim.id} className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2">
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
    if (!confirm('Approve this claim?')) return
    setProcessing(claimId)
    try { await approveWrestlerClaim(claimId); await loadClaims() }
    catch (err: any) { alert(`Error: ${err.message}`) }
    setProcessing(null)
  }

  async function handleReject(claimId: string) {
    const notes = prompt('Rejection reason (optional):')
    if (notes === null) return
    setProcessing(claimId)
    try { await rejectWrestlerClaim(claimId, notes); await loadClaims() }
    catch (err: any) { alert(`Error: ${err.message}`) }
    setProcessing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Wrestler Claims</h2>
        <button onClick={() => setShowAll(!showAll)} className="btn btn-ghost text-sm">
          {showAll ? 'Show Pending Only' : 'Show All Claims'}
        </button>
      </div>

      {loading ? <LoadingSpinner /> : claims.length === 0 ? (
        <EmptyState text={showAll ? 'No claims found.' : 'No pending wrestler claims.'} />
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/wrestlers/${claim.wrestlers?.slug}`} className="font-semibold text-accent hover:underline" target="_blank">
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
                    <button onClick={() => handleApprove(claim.id)} disabled={processing === claim.id} className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                      {processing === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                    </button>
                    <button onClick={() => handleReject(claim.id)} disabled={processing === claim.id} className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2">
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
// EVENTS TAB (with inline editing)
// ============================================

function EventsTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchEvents(query)
    setResults(data)
    setLoading(false)
  }

  async function handleDelete(eventId: string, eventName: string) {
    if (!confirm(`Delete "${eventName}"? This cannot be undone.`)) return
    try { await deleteEvent(eventId); setResults(results.filter(e => e.id !== eventId)) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleStatusChange(eventId: string, newStatus: string) {
    try { await updateEventStatus(eventId, newStatus); setResults(results.map(e => e.id === eventId ? { ...e, status: newStatus } : e)) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openEdit(eventId: string) {
    try { const data = await getEventFull(eventId); setEditing(data) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Events</h2>
      <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} placeholder="Search events by name..." />

      {editing && <EditEventModal event={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); handleSearch() }} />}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((event) => (
            <div key={event.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/events/${event.id}`} target="_blank" className="font-semibold text-accent hover:underline truncate">{event.name}</Link>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-sm text-foreground-muted">{event.event_date} • {event.promotions?.name} • {event.city}, {event.state}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(event.id)} className="p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <select value={event.status} onChange={(e) => handleStatusChange(event.id, e.target.value)} className="text-xs bg-background-tertiary border border-border rounded px-2 py-1 text-foreground">
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => handleDelete(event.id, event.name)} className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// PROMOTIONS TAB (with verify & edit)
// ============================================

function PromotionsTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchPromotions(query)
    setResults(data)
    setLoading(false)
  }

  async function handleVerify(id: string, isVerified: boolean) {
    try {
      if (isVerified) await unverifyPromotion(id)
      else await verifyPromotion(id)
      setResults(results.map(p => p.id === id ? { ...p, verification_status: isVerified ? 'unverified' : 'verified' } : p))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openEdit(id: string) {
    try { const data = await getPromotionFull(id); setEditing(data) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Promotions</h2>
      <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} placeholder="Search promotions by name..." />

      {editing && <EditPromotionModal promo={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); handleSearch() }} />}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((promo) => (
            <div key={promo.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/promotions/${promo.slug}`} target="_blank" className="font-semibold text-accent hover:underline">{promo.name}</Link>
                  {promo.verification_status === 'verified' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verified</span>}
                </div>
                <p className="text-sm text-foreground-muted">{promo.city && promo.state ? `${promo.city}, ${promo.state}` : 'No location'} • {promo.claimed_by ? 'Claimed' : 'Unclaimed'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(promo.id)} className="p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleVerify(promo.id, promo.verification_status === 'verified')} className={`p-2 rounded transition-colors ${promo.verification_status === 'verified' ? 'text-green-400 hover:bg-green-500/20' : 'text-foreground-muted hover:bg-accent/10'}`} title={promo.verification_status === 'verified' ? 'Remove verification' : 'Verify'}>
                  <BadgeCheck className="w-4 h-4" />
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
// WRESTLERS TAB (with verify, edit, delete)
// ============================================

function WrestlersTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    const data = await searchWrestlersAdmin(query)
    setResults(data)
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await deleteWrestler(id); setResults(results.filter(w => w.id !== id)) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleVerify(id: string, isVerified: boolean) {
    try {
      if (isVerified) await unverifyWrestler(id)
      else await verifyWrestler(id)
      setResults(results.map(w => w.id === id ? { ...w, verification_status: isVerified ? 'unverified' : 'verified' } : w))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openEdit(id: string) {
    try { const data = await getWrestlerFull(id); setEditing(data) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Manage Wrestlers</h2>
      <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} placeholder="Search wrestlers by name..." />

      {editing && <EditWrestlerModal wrestler={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); handleSearch() }} />}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((w) => (
            <div key={w.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/wrestlers/${w.slug}`} target="_blank" className="font-semibold text-accent hover:underline">{w.name}</Link>
                  {w.pwi_ranking && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">PWI #{w.pwi_ranking}</span>}
                  {w.verification_status === 'verified' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Verified</span>}
                </div>
                <p className="text-sm text-foreground-muted">{w.claimed_by ? 'Claimed' : 'Unclaimed'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(w.id)} className="p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleVerify(w.id, w.verification_status === 'verified')} className={`p-2 rounded transition-colors ${w.verification_status === 'verified' ? 'text-green-400 hover:bg-green-500/20' : 'text-foreground-muted hover:bg-accent/10'}`} title={w.verification_status === 'verified' ? 'Remove verification' : 'Verify'}>
                  <BadgeCheck className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(w.id, w.name)} className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// ANNOUNCEMENTS TAB
// ============================================

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ message: '', type: 'info', link_url: '', link_text: '', ends_at: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAnnouncements() }, [])

  async function loadAnnouncements() {
    setLoading(true)
    const data = await getAnnouncements()
    setAnnouncements(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.message.trim()) return
    setSaving(true)
    try {
      await createAnnouncement({
        message: form.message,
        type: form.type,
        link_url: form.link_url || undefined,
        link_text: form.link_text || undefined,
        ends_at: form.ends_at || null,
      })
      setForm({ message: '', type: 'info', link_url: '', link_text: '', ends_at: '' })
      setShowForm(false)
      await loadAnnouncements()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  async function handleToggle(id: string, isActive: boolean) {
    try { await toggleAnnouncement(id, !isActive); await loadAnnouncements() }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    try { await deleteAnnouncement(id); await loadAnnouncements() }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Site Announcements</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <input type="text" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full input-field" placeholder="Your announcement message..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full input-field">
                <option value="info">Info (blue)</option>
                <option value="warning">Warning (yellow)</option>
                <option value="success">Success (green)</option>
                <option value="promo">Promo (accent)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires (optional)</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="w-full input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
              <input type="text" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="w-full input-field" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link Text (optional)</label>
              <input type="text" value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} className="w-full input-field" placeholder="Learn more →" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Create</>}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : announcements.length === 0 ? (
        <EmptyState text="No announcements yet." />
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={a.type} />
                  <span className={a.is_active ? 'text-green-400 text-xs' : 'text-foreground-muted text-xs'}>{a.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm">{a.message}</p>
                {a.link_url && <p className="text-xs text-accent">{a.link_text || a.link_url}</p>}
                <p className="text-xs text-foreground-muted/60 mt-1">Created {new Date(a.created_at).toLocaleDateString()}{a.ends_at ? ` • Expires ${new Date(a.ends_at).toLocaleDateString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(a.id, a.is_active)} className="p-2 hover:bg-background-tertiary rounded transition-colors" title={a.is_active ? 'Deactivate' : 'Activate'}>
                  {a.is_active ? <EyeOff className="w-4 h-4 text-foreground-muted" /> : <Eye className="w-4 h-4 text-green-400" />}
                </button>
                <button onClick={() => handleDelete(a.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// USERS & BANS TAB
// ============================================

function UsersTab() {
  const [banned, setBanned] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [banEmail, setBanEmail] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banUserId, setBanUserId] = useState('')
  const [banning, setBanning] = useState(false)

  useEffect(() => { loadBanned() }, [])

  async function loadBanned() {
    setLoading(true)
    const data = await getBannedUsers()
    setBanned(data)
    setLoading(false)
  }

  async function handleBan() {
    if (!banUserId.trim()) { alert('Enter a User ID (UUID from Supabase Auth → Users)'); return }
    setBanning(true)
    try {
      await banUser(banUserId.trim(), banReason)
      setBanUserId('')
      setBanReason('')
      await loadBanned()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setBanning(false)
  }

  async function handleUnban(userId: string) {
    if (!confirm('Unban this user?')) return
    try { await unbanUser(userId); await loadBanned() }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-6">Users & Bans</h2>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold mb-4">Ban a User</h3>
        <p className="text-sm text-foreground-muted mb-4">Copy the user&apos;s UUID from Supabase Dashboard → Authentication → Users</p>
        <div className="space-y-3">
          <input type="text" value={banUserId} onChange={(e) => setBanUserId(e.target.value)} className="w-full input-field" placeholder="User ID (UUID)" />
          <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full input-field" placeholder="Reason for ban (optional)" />
          <button onClick={handleBan} disabled={banning} className="btn bg-red-600 hover:bg-red-700 text-white text-sm">
            {banning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4 mr-1" /> Ban User</>}
          </button>
        </div>
      </div>

      <h3 className="font-semibold mb-4">Banned Users ({banned.length})</h3>
      {loading ? <LoadingSpinner /> : banned.length === 0 ? (
        <EmptyState text="No banned users." />
      ) : (
        <div className="space-y-2">
          {banned.map((b) => (
            <div key={b.user_id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="font-mono text-sm">{b.user_id}</p>
                {b.reason && <p className="text-sm text-foreground-muted">Reason: {b.reason}</p>}
                <p className="text-xs text-foreground-muted/60">Banned {new Date(b.banned_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleUnban(b.user_id)} className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                <UserCheck className="w-4 h-4 mr-1" /> Unban
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// MERGE WRESTLERS TAB
// ============================================

function MergeTab() {
  const [keepQuery, setKeepQuery] = useState('')
  const [removeQuery, setRemoveQuery] = useState('')
  const [keepResults, setKeepResults] = useState<any[]>([])
  const [removeResults, setRemoveResults] = useState<any[]>([])
  const [keepSelected, setKeepSelected] = useState<any>(null)
  const [removeSelected, setRemoveSelected] = useState<any>(null)
  const [merging, setMerging] = useState(false)

  async function searchKeep() {
    if (!keepQuery.trim()) return
    const data = await searchWrestlersAdmin(keepQuery)
    setKeepResults(data)
  }

  async function searchRemove() {
    if (!removeQuery.trim()) return
    const data = await searchWrestlersAdmin(removeQuery)
    setRemoveResults(data)
  }

  async function handleMerge() {
    if (!keepSelected || !removeSelected) { alert('Select both wrestlers'); return }
    if (keepSelected.id === removeSelected.id) { alert('Cannot merge a wrestler with themselves'); return }
    if (!confirm(`Merge "${removeSelected.name}" INTO "${keepSelected.name}"?\n\nAll events, follows, and data from "${removeSelected.name}" will be moved to "${keepSelected.name}", and "${removeSelected.name}" will be deleted.\n\nThis CANNOT be undone.`)) return

    setMerging(true)
    try {
      await mergeWrestlers(keepSelected.id, removeSelected.id)
      alert(`Successfully merged "${removeSelected.name}" into "${keepSelected.name}"`)
      setKeepSelected(null)
      setRemoveSelected(null)
      setKeepResults([])
      setRemoveResults([])
      setKeepQuery('')
      setRemoveQuery('')
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setMerging(false)
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-2">Merge Duplicate Wrestlers</h2>
      <p className="text-sm text-foreground-muted mb-6">Combine two wrestler profiles into one. Events, follows, and data from the removed wrestler will be transferred to the kept wrestler.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Keep */}
        <div className="card p-6">
          <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Keep This Wrestler</h3>
          <SearchBar query={keepQuery} setQuery={setKeepQuery} onSearch={searchKeep} loading={false} placeholder="Search wrestler to keep..." />
          {keepSelected ? (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{keepSelected.name}</p>
                {keepSelected.pwi_ranking && <span className="text-xs text-amber-400">PWI #{keepSelected.pwi_ranking}</span>}
              </div>
              <button onClick={() => setKeepSelected(null)} className="text-foreground-muted hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              {keepResults.map(w => (
                <button key={w.id} onClick={() => { setKeepSelected(w); setKeepResults([]) }} className="w-full text-left p-2 hover:bg-background-tertiary rounded text-sm">
                  {w.name} {w.pwi_ranking ? `(PWI #${w.pwi_ranking})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Remove */}
        <div className="card p-6">
          <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2"><XCircle className="w-5 h-5" /> Remove This Wrestler (merge into kept)</h3>
          <SearchBar query={removeQuery} setQuery={setRemoveQuery} onSearch={searchRemove} loading={false} placeholder="Search wrestler to remove..." />
          {removeSelected ? (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{removeSelected.name}</p>
                {removeSelected.pwi_ranking && <span className="text-xs text-amber-400">PWI #{removeSelected.pwi_ranking}</span>}
              </div>
              <button onClick={() => setRemoveSelected(null)} className="text-foreground-muted hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              {removeResults.map(w => (
                <button key={w.id} onClick={() => { setRemoveSelected(w); setRemoveResults([]) }} className="w-full text-left p-2 hover:bg-background-tertiary rounded text-sm">
                  {w.name} {w.pwi_ranking ? `(PWI #${w.pwi_ranking})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {keepSelected && removeSelected && (
        <div className="mt-6 text-center">
          <button onClick={handleMerge} disabled={merging} className="btn bg-red-600 hover:bg-red-700 text-white px-8 py-3">
            {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GitMerge className="w-5 h-5 mr-2" /> Merge &ldquo;{removeSelected.name}&rdquo; into &ldquo;{keepSelected.name}&rdquo;</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// BULK IMPORT TAB
// ============================================

function ImportTab() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [csvText, setCsvText] = useState('')
  const [selectedPromo, setSelectedPromo] = useState('')
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    getAllPromotionsList().then(setPromotions)
  }, [])

  function parseCSV() {
    if (!csvText.trim()) return
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const events = lines.slice(1).map(line => {
      // Handle quoted fields
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
        current += char
      }
      values.push(current.trim())

      const row: any = {}
      headers.forEach((h, i) => { if (values[i]) row[h] = values[i] })
      return row
    }).filter(row => row.name && row.event_date)

    setPreview(events)
  }

  async function handleImport() {
    if (preview.length === 0) return
    setImporting(true)
    try {
      const events = preview.map(row => ({
        name: row.name,
        event_date: row.event_date,
        promotion_id: selectedPromo || row.promotion_id || undefined,
        venue_name: row.venue_name || row.venue || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        ticket_url: row.ticket_url || undefined,
        doors_time: row.doors_time || undefined,
        start_time: row.start_time || undefined,
      }))
      const data = await bulkImportEvents(events)
      setResult(`Successfully imported ${data.length} events!`)
      setCsvText('')
      setPreview([])
    } catch (err: any) { setResult(`Error: ${err.message}`) }
    setImporting(false)
  }

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-2">Bulk Import Events</h2>
      <p className="text-sm text-foreground-muted mb-6">
        Paste CSV data with headers: <code className="bg-background-tertiary px-1 rounded">name, event_date, venue_name, city, state, ticket_url, doors_time, start_time</code>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Default Promotion (optional)</label>
          <select value={selectedPromo} onChange={(e) => setSelectedPromo(e.target.value)} className="w-full input-field max-w-md">
            <option value="">-- No default promotion --</option>
            {promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CSV Data</label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            className="w-full input-field font-mono text-xs"
            placeholder={`name,event_date,venue_name,city,state,ticket_url\nSummer Slam 2025,2025-08-01,The Arena,Houston,TX,https://tickets.com/123`}
          />
        </div>

        <button onClick={parseCSV} className="btn btn-secondary text-sm">
          <Eye className="w-4 h-4 mr-1" /> Preview Import
        </button>

        {preview.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{preview.length} events to import:</h3>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-background-tertiary sticky top-0">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Venue</th>
                    <th className="text-left p-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.event_date}</td>
                      <td className="p-2">{row.venue_name || row.venue || '-'}</td>
                      <td className="p-2">{[row.city, row.state].filter(Boolean).join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleImport} disabled={importing} className="btn btn-primary text-sm mt-4">
              {importing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              Import {preview.length} Events
            </button>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${result.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// EDIT MODALS
// ============================================

function EditWrestlerModal({ wrestler, onClose, onSaved }: { wrestler: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({ name: wrestler.name || '', slug: wrestler.slug || '', bio: wrestler.bio || '', hometown: wrestler.hometown || '', pwi_ranking: wrestler.pwi_ranking || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateWrestlerAdmin(wrestler.id, {
        name: form.name,
        slug: form.slug,
        bio: form.bio || null,
        hometown: form.hometown || null,
        pwi_ranking: form.pwi_ranking ? parseInt(form.pwi_ranking) : null,
      })
      onSaved()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`Edit: ${wrestler.name}`} onClose={onClose}>
      <div className="space-y-3">
        <FieldRow label="Name"><input className="w-full input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></FieldRow>
        <FieldRow label="Slug"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></FieldRow>
        <FieldRow label="Hometown"><input className="w-full input-field" value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} /></FieldRow>
        <FieldRow label="PWI Ranking"><input className="w-full input-field" type="number" value={form.pwi_ranking} onChange={e => setForm({...form, pwi_ranking: e.target.value})} /></FieldRow>
        <FieldRow label="Bio"><textarea className="w-full input-field" rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></FieldRow>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}</button>
          <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

function EditPromotionModal({ promo, onClose, onSaved }: { promo: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({ name: promo.name || '', slug: promo.slug || '', city: promo.city || '', state: promo.state || '', website: promo.website || '', description: promo.description || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updatePromotionAdmin(promo.id, {
        name: form.name,
        slug: form.slug,
        city: form.city || null,
        state: form.state || null,
        website: form.website || null,
        description: form.description || null,
      })
      onSaved()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`Edit: ${promo.name}`} onClose={onClose}>
      <div className="space-y-3">
        <FieldRow label="Name"><input className="w-full input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></FieldRow>
        <FieldRow label="Slug"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></FieldRow>
        <FieldRow label="City"><input className="w-full input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></FieldRow>
        <FieldRow label="State"><input className="w-full input-field" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></FieldRow>
        <FieldRow label="Website"><input className="w-full input-field" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></FieldRow>
        <FieldRow label="Description"><textarea className="w-full input-field" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></FieldRow>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}</button>
          <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

function EditEventModal({ event, onClose, onSaved }: { event: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({ name: event.name || '', event_date: event.event_date || '', venue_name: event.venue_name || '', city: event.city || '', state: event.state || '', ticket_url: event.ticket_url || '', doors_time: event.doors_time || '', start_time: event.start_time || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateEventAdmin(event.id, {
        name: form.name,
        event_date: form.event_date,
        venue_name: form.venue_name || null,
        city: form.city || null,
        state: form.state || null,
        ticket_url: form.ticket_url || null,
        doors_time: form.doors_time || null,
        start_time: form.start_time || null,
      })
      onSaved()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`Edit: ${event.name}`} onClose={onClose}>
      <div className="space-y-3">
        <FieldRow label="Name"><input className="w-full input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></FieldRow>
        <FieldRow label="Date"><input className="w-full input-field" type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} /></FieldRow>
        <FieldRow label="Venue"><input className="w-full input-field" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="City"><input className="w-full input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></FieldRow>
          <FieldRow label="State"><input className="w-full input-field" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></FieldRow>
        </div>
        <FieldRow label="Ticket URL"><input className="w-full input-field" value={form.ticket_url} onChange={e => setForm({...form, ticket_url: e.target.value})} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Doors"><input className="w-full input-field" value={form.doors_time} onChange={e => setForm({...form, doors_time: e.target.value})} /></FieldRow>
          <FieldRow label="Start"><input className="w-full input-field" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} /></FieldRow>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}</button>
          <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

// ============================================
// SHARED COMPONENTS
// ============================================

function LoadingSpinner() {
  return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="card p-8 text-center text-foreground-muted">{text}</div>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    upcoming: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-foreground-muted/20 text-foreground-muted',
    cancelled: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    success: 'bg-green-500/20 text-green-400',
    promo: 'bg-accent/20 text-accent',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-background-tertiary text-foreground-muted'}`}>{status}</span>
}

function SearchBar({ query, setQuery, onSearch, loading, placeholder }: { query: string, setQuery: (v: string) => void, onSearch: () => void, loading: boolean, placeholder: string }) {
  return (
    <div className="flex gap-2 mb-6">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder={placeholder}
        className="flex-1 px-4 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
      <button onClick={onSearch} disabled={loading} className="btn btn-primary px-6">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" /> Search</>}
      </button>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-background-secondary border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-background-tertiary rounded"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-muted mb-1">{label}</label>
      {children}
    </div>
  )
}
