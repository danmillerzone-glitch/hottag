'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ImageCropUploader from '@/components/ImageCropUploader'
import { COUNTRIES, getFlag } from '@/lib/countries'
import {
  checkIsAdmin, getAdminStats,
  getPendingPromotionClaims, getPendingWrestlerClaims,
  getAllPromotionClaims, getAllWrestlerClaims,
  approvePromotionClaim, rejectPromotionClaim,
  approveWrestlerClaim, rejectWrestlerClaim,
  searchEvents, searchPromotions, searchWrestlersAdmin,
  deleteEvent, deleteWrestler, deletePromotion, updateEventStatus,
  getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
  banUser, unbanUser, getBannedUsers,
  updateWrestlerAdmin, updatePromotionAdmin, updateEventAdmin,
  getWrestlerFull, getPromotionFull, getEventFull,
  verifyWrestler, unverifyWrestler, verifyPromotion, unverifyPromotion,
  mergeWrestlers,
  bulkImportEvents, getAllPromotionsList,
  createWrestlerAdmin, createPromotionAdmin,
  uploadWrestlerPhotoAdmin, uploadWrestlerRenderAdmin, uploadPromotionLogoAdmin,
  getPromotionChampionshipsAdmin, deleteChampionshipAdmin,
  createChampionshipAdmin, updateChampionshipAdmin,
  getPromotionRosterAdmin, addToRosterAdmin, removeFromRosterAdmin,
  getPromotionGroupsAdmin, createGroupAdmin, updateGroupAdmin, deleteGroupAdmin,
  addGroupMemberAdmin, removeGroupMemberAdmin,
} from '@/lib/admin'
import {
  Shield, BarChart3, CheckCircle, XCircle, Clock, Users,
  Building2, Calendar, Search, Trash2, ExternalLink,
  AlertTriangle, Loader2, User, Award, Megaphone,
  Ban, UserCheck, Edit3, GitMerge, Upload, Eye, EyeOff,
  Plus, Save, X, BadgeCheck, Key, Copy, RefreshCw, Crown, Inbox,
} from 'lucide-react'

type Tab = 'overview' | 'promo-claims' | 'wrestler-claims' | 'events' | 'promotions' | 'wrestlers' | 'announcements' | 'users' | 'merge' | 'import' | 'requests'

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
    { id: 'requests', label: 'Page Requests', icon: Inbox },
  ]

  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
              <p className="text-sm text-foreground-muted">Manage Hot Tag platform</p>
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
        {activeTab === 'requests' && <PageRequestsTab />}
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
  const [creating, setCreating] = useState(false)
  const [viewingChamps, setViewingChamps] = useState<{ promoId: string, promoName: string, championships: any[] } | null>(null)
  const [viewingRoster, setViewingRoster] = useState<{ promoId: string, promoName: string, roster: any[] } | null>(null)
  const [viewingGroups, setViewingGroups] = useState<{ promoId: string, promoName: string, groups: any[] } | null>(null)

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all associated events, championships, and claims. This cannot be undone.`)) return
    try { await deletePromotion(id); setResults(results.filter(p => p.id !== id)) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openEdit(id: string) {
    try { const data = await getPromotionFull(id); setEditing(data) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openChampionships(promoId: string, promoName: string) {
    try {
      const champs = await getPromotionChampionshipsAdmin(promoId)
      setViewingChamps({ promoId, promoName, championships: champs })
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openRoster(promoId: string, promoName: string) {
    try {
      const roster = await getPromotionRosterAdmin(promoId)
      setViewingRoster({ promoId, promoName, roster })
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function openGroups(promoId: string, promoName: string) {
    try {
      const groups = await getPromotionGroupsAdmin(promoId)
      setViewingGroups({ promoId, promoName, groups })
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleDeleteChampionship(champId: string, champName: string) {
    if (!confirm(`Delete championship "${champName}"? This cannot be undone.`)) return
    try {
      await deleteChampionshipAdmin(champId)
      if (viewingChamps) {
        setViewingChamps({ ...viewingChamps, championships: viewingChamps.championships.filter(c => c.id !== champId) })
      }
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Manage Promotions</h2>
        <button onClick={() => setCreating(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1" /> New Promotion
        </button>
      </div>
      <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} placeholder="Search promotions by name..." />

      {creating && <CreatePromotionModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); if (query) handleSearch() }} />}
      {editing && <EditPromotionModal promo={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); handleSearch() }} />}

      {/* Championships Modal */}
      {viewingChamps && (
        <ChampionshipsManagerModal
          promoId={viewingChamps.promoId}
          promoName={viewingChamps.promoName}
          championships={viewingChamps.championships}
          onUpdate={(champs) => setViewingChamps({ ...viewingChamps, championships: champs })}
          onClose={() => setViewingChamps(null)}
        />
      )}

      {/* Roster Modal */}
      {viewingRoster && (
        <RosterManagerModal
          promoId={viewingRoster.promoId}
          promoName={viewingRoster.promoName}
          roster={viewingRoster.roster}
          onUpdate={(roster) => setViewingRoster({ ...viewingRoster, roster })}
          onClose={() => setViewingRoster(null)}
        />
      )}

      {/* Groups Modal */}
      {viewingGroups && (
        <GroupsManagerModal
          promoId={viewingGroups.promoId}
          promoName={viewingGroups.promoName}
          groups={viewingGroups.groups}
          onUpdate={(groups) => setViewingGroups({ ...viewingGroups, groups })}
          onClose={() => setViewingGroups(null)}
        />
      )}

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
                <button onClick={() => openRoster(promo.id, promo.name)} className="p-2 text-foreground-muted hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Roster"><Users className="w-4 h-4" /></button>
                <button onClick={() => openGroups(promo.id, promo.name)} className="p-2 text-foreground-muted hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors" title="Tag Teams & Factions"><Shield className="w-4 h-4" /></button>
                <button onClick={() => openChampionships(promo.id, promo.name)} className="p-2 text-foreground-muted hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Championships"><Award className="w-4 h-4" /></button>
                <button onClick={() => openEdit(promo.id)} className="p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleVerify(promo.id, promo.verification_status === 'verified')} className={`p-2 rounded transition-colors ${promo.verification_status === 'verified' ? 'text-green-400 hover:bg-green-500/20' : 'text-foreground-muted hover:bg-accent/10'}`} title={promo.verification_status === 'verified' ? 'Remove verification' : 'Verify'}>
                  <BadgeCheck className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(promo.id, promo.name)} className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
  const [creating, setCreating] = useState(false)

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold">Manage Wrestlers</h2>
        <button onClick={() => setCreating(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1" /> New Wrestler
        </button>
      </div>
      <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} placeholder="Search wrestlers by name..." />

      {creating && <CreateWrestlerModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); if (query) handleSearch() }} />}
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
  const [form, setForm] = useState({
    name: wrestler.name || '', slug: wrestler.slug || '', moniker: wrestler.moniker || '',
    bio: wrestler.bio || '', birthplace: wrestler.birthplace || '', residence: wrestler.residence || wrestler.hometown || '',
    height: wrestler.height || '', weight: wrestler.weight || '',
    birthday: wrestler.birthday || '', debut_year: wrestler.debut_year || '', trainer: wrestler.trainer || '',
    pwi_ranking: wrestler.pwi_ranking || '',
    twitter_handle: wrestler.twitter_handle || '', instagram_handle: wrestler.instagram_handle || '',
    tiktok_handle: wrestler.tiktok_handle || '', youtube_url: wrestler.youtube_url || '',
    website: wrestler.website || '', booking_email: wrestler.booking_email || '', merch_url: wrestler.merch_url || '',
    bluesky_handle: wrestler.bluesky_handle || '', patreon_url: wrestler.patreon_url || '',
  })
  const [countriesWrestled, setCountriesWrestled] = useState<string[]>(wrestler.countries_wrestled || [])
  const [signatureMoves, setSignatureMoves] = useState<string[]>(wrestler.signature_moves || [])
  const [newMove, setNewMove] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateWrestlerAdmin(wrestler.id, {
        name: form.name, slug: form.slug, moniker: form.moniker || null,
        bio: form.bio || null, birthplace: form.birthplace || null,
        residence: form.residence || null, hometown: form.residence || null,
        height: form.height || null, weight: form.weight || null,
        birthday: form.birthday || null, debut_year: form.debut_year ? parseInt(form.debut_year) : null,
        trainer: form.trainer || null,
        pwi_ranking: form.pwi_ranking ? parseInt(form.pwi_ranking) : null,
        twitter_handle: form.twitter_handle || null, instagram_handle: form.instagram_handle || null,
        tiktok_handle: form.tiktok_handle || null, youtube_url: form.youtube_url || null,
        website: form.website || null, booking_email: form.booking_email || null, merch_url: form.merch_url || null,
        bluesky_handle: form.bluesky_handle || null, patreon_url: form.patreon_url || null,
        countries_wrestled: countriesWrestled.length > 0 ? countriesWrestled : null,
        signature_moves: signatureMoves.length > 0 ? signatureMoves : null,
      })
      onSaved()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`Edit: ${wrestler.name}`} onClose={onClose}>
      <div className="space-y-3">
        <ImageCropUploader
          currentUrl={wrestler.photo_url}
          shape="square"
          size={80}
          onUpload={(file) => uploadWrestlerPhotoAdmin(wrestler.id, file)}
          label="Upload Photo"
        />
        <div className="mt-3">
          <label className="text-sm font-medium mb-1 block">Hero Image (transparent PNG)</label>
          {wrestler.render_url && (
            <div className="mb-2 p-2 rounded bg-background-tertiary inline-block">
              <img src={wrestler.render_url} alt="Render" className="h-20 object-contain" />
            </div>
          )}
          <label className="btn btn-secondary text-xs cursor-pointer inline-flex">
            Upload Hero Image
            <input type="file" accept="image/png" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try { await uploadWrestlerRenderAdmin(wrestler.id, file); onClose() } catch { alert('Upload failed') }
            }} />
          </label>
        </div>
        <FieldRow label="Name"><input className="w-full input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></FieldRow>
        <FieldRow label="Moniker"><input className="w-full input-field" value={form.moniker} onChange={e => setForm({...form, moniker: e.target.value})} placeholder='e.g. "The Phenomenal One"' /></FieldRow>
        <FieldRow label="Slug"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Birthplace"><input className="w-full input-field" value={form.birthplace} onChange={e => setForm({...form, birthplace: e.target.value})} placeholder="e.g. Gainesville, GA" /></FieldRow>
          <FieldRow label="Currently Residing In"><input className="w-full input-field" value={form.residence} onChange={e => setForm({...form, residence: e.target.value})} placeholder="e.g. Houston, TX" /></FieldRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Height"><input className="w-full input-field" value={form.height} onChange={e => setForm({...form, height: e.target.value})} placeholder="e.g. 6 ft 1 in" /></FieldRow>
          <FieldRow label="Weight"><input className="w-full input-field" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 218 lbs" /></FieldRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Birthday"><input className="w-full input-field" type="date" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} /></FieldRow>
          <FieldRow label="Debut Year"><input className="w-full input-field" type="number" value={form.debut_year} onChange={e => setForm({...form, debut_year: e.target.value})} placeholder="e.g. 2015" /></FieldRow>
        </div>
        <FieldRow label="Trainer"><input className="w-full input-field" value={form.trainer} onChange={e => setForm({...form, trainer: e.target.value})} placeholder="e.g. Tom Prichard" /></FieldRow>
        <FieldRow label="PWI Ranking"><input className="w-full input-field" type="number" value={form.pwi_ranking} onChange={e => setForm({...form, pwi_ranking: e.target.value})} /></FieldRow>
        <FieldRow label="Bio"><textarea className="w-full input-field" rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></FieldRow>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Countries Wrestled</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {countriesWrestled.map(code => (
              <button key={code} onClick={() => setCountriesWrestled(countriesWrestled.filter(c => c !== code))} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background-tertiary hover:bg-red-500/20 text-sm transition-colors" title={`Remove ${code}`}>
                {getFlag(code)} {code} <X className="w-3 h-3" />
              </button>
            ))}
            {countriesWrestled.length === 0 && <span className="text-sm text-foreground-muted">None added</span>}
          </div>
          <select
            className="input-field text-sm"
            value=""
            onChange={(e) => {
              if (e.target.value && !countriesWrestled.includes(e.target.value)) {
                setCountriesWrestled([...countriesWrestled, e.target.value])
              }
              e.target.value = ''
            }}
          >
            <option value="">+ Add country...</option>
            {COUNTRIES.filter(c => !countriesWrestled.includes(c.code)).map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Signature Moves</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {signatureMoves.map((move, i) => (
              <button key={i} onClick={() => setSignatureMoves(signatureMoves.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent hover:bg-red-500/20 hover:text-red-400 text-sm transition-colors">
                {move} <X className="w-3 h-3" />
              </button>
            ))}
            {signatureMoves.length === 0 && <span className="text-sm text-foreground-muted">None added</span>}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 input-field text-sm" value={newMove} onChange={e => setNewMove(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newMove.trim()) { e.preventDefault(); setSignatureMoves([...signatureMoves, newMove.trim()]); setNewMove('') } }}
              placeholder="e.g. Superkick, Piledriver..." />
            <button type="button" onClick={() => { if (newMove.trim()) { setSignatureMoves([...signatureMoves, newMove.trim()]); setNewMove('') } }} className="btn btn-secondary text-xs">+ Add</button>
          </div>
        </div>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Social Links</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="X / Twitter"><input className="w-full input-field" value={form.twitter_handle} onChange={e => setForm({...form, twitter_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="Instagram"><input className="w-full input-field" value={form.instagram_handle} onChange={e => setForm({...form, instagram_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="TikTok"><input className="w-full input-field" value={form.tiktok_handle} onChange={e => setForm({...form, tiktok_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="YouTube"><input className="w-full input-field" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/..." /></FieldRow>
            <FieldRow label="Website"><input className="w-full input-field" value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://..." /></FieldRow>
            <FieldRow label="Booking Email"><input className="w-full input-field" value={form.booking_email} onChange={e => setForm({...form, booking_email: e.target.value})} placeholder="email@..." /></FieldRow>
          </div>
          <div className="mt-3">
            <FieldRow label="Merch URL"><input className="w-full input-field" value={form.merch_url} onChange={e => setForm({...form, merch_url: e.target.value})} placeholder="https://..." /></FieldRow>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FieldRow label="Bluesky"><input className="w-full input-field" value={form.bluesky_handle} onChange={e => setForm({...form, bluesky_handle: e.target.value})} placeholder="handle.bsky.social" /></FieldRow>
            <FieldRow label="Patreon"><input className="w-full input-field" value={form.patreon_url} onChange={e => setForm({...form, patreon_url: e.target.value})} placeholder="https://patreon.com/..." /></FieldRow>
          </div>
        </div>
        <ClaimCodeSection type="wrestlers" id={wrestler.id} currentCode={wrestler.claim_code} claimedBy={wrestler.claimed_by} />
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}</button>
          <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

function EditPromotionModal({ promo, onClose, onSaved }: { promo: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({
    name: promo.name || '', slug: promo.slug || '', city: promo.city || '', state: promo.state || '',
    website: promo.website || '', description: promo.description || '',
    twitter_handle: promo.twitter_handle || '', instagram_handle: promo.instagram_handle || '',
    tiktok_handle: promo.tiktok_handle || '', facebook_url: promo.facebook_url || '', youtube_url: promo.youtube_url || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updatePromotionAdmin(promo.id, {
        name: form.name, slug: form.slug, city: form.city || null, state: form.state || null,
        website: form.website || null, description: form.description || null,
        twitter_handle: form.twitter_handle || null, instagram_handle: form.instagram_handle || null,
        tiktok_handle: form.tiktok_handle || null, facebook_url: form.facebook_url || null, youtube_url: form.youtube_url || null,
      })
      onSaved()
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title={`Edit: ${promo.name}`} onClose={onClose}>
      <div className="space-y-3">
        <ImageCropUploader
          currentUrl={promo.logo_url}
          shape="square"
          size={80}
          onUpload={(file) => uploadPromotionLogoAdmin(promo.id, file)}
          label="Upload Logo"
        />
        <FieldRow label="Name"><input className="w-full input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></FieldRow>
        <FieldRow label="Slug"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="City"><input className="w-full input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></FieldRow>
          <FieldRow label="State"><input className="w-full input-field" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></FieldRow>
        </div>
        <FieldRow label="Website"><input className="w-full input-field" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></FieldRow>
        <FieldRow label="Description"><textarea className="w-full input-field" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></FieldRow>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Social Links</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="X / Twitter"><input className="w-full input-field" value={form.twitter_handle} onChange={e => setForm({...form, twitter_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="Instagram"><input className="w-full input-field" value={form.instagram_handle} onChange={e => setForm({...form, instagram_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="TikTok"><input className="w-full input-field" value={form.tiktok_handle} onChange={e => setForm({...form, tiktok_handle: e.target.value})} placeholder="@handle" /></FieldRow>
            <FieldRow label="Facebook"><input className="w-full input-field" value={form.facebook_url} onChange={e => setForm({...form, facebook_url: e.target.value})} placeholder="https://facebook.com/..." /></FieldRow>
            <FieldRow label="YouTube"><input className="w-full input-field" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/..." /></FieldRow>
          </div>
        </div>
        <ClaimCodeSection type="promotions" id={promo.id} currentCode={promo.claim_code} claimedBy={promo.claimed_by} />
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
        name: form.name, event_date: form.event_date, venue_name: form.venue_name || null,
        city: form.city || null, state: form.state || null, ticket_url: form.ticket_url || null,
        doors_time: form.doors_time || null, start_time: form.start_time || null,
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
// CREATE MODALS
// ============================================

function CreateWrestlerModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', slug: '', moniker: '', bio: '', birthplace: '', residence: '',
    height: '', weight: '', birthday: '', debut_year: '', trainer: '', pwi_ranking: '',
    twitter_handle: '', instagram_handle: '', tiktok_handle: '', youtube_url: '',
    website: '', booking_email: '', merch_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: autoSlug(name) })
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.slug.trim()) { alert('Name and slug are required'); return }
    setSaving(true)
    try {
      const data = await createWrestlerAdmin({
        name: form.name.trim(), slug: form.slug.trim(),
        bio: form.bio || undefined, hometown: form.residence || undefined,
        pwi_ranking: form.pwi_ranking ? parseInt(form.pwi_ranking) : null,
      })
      setCreatedId(data.id)
      await updateWrestlerAdmin(data.id, {
        moniker: form.moniker || null, birthplace: form.birthplace || null, residence: form.residence || null,
        height: form.height || null, weight: form.weight || null,
        birthday: form.birthday || null, debut_year: form.debut_year ? parseInt(form.debut_year) : null,
        trainer: form.trainer || null,
        twitter_handle: form.twitter_handle || null, instagram_handle: form.instagram_handle || null,
        tiktok_handle: form.tiktok_handle || null, youtube_url: form.youtube_url || null,
        website: form.website || null, booking_email: form.booking_email || null, merch_url: form.merch_url || null,
      })
      alert(`Created wrestler: ${form.name}. You can now upload a photo or close.`)
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title="Create New Wrestler" onClose={() => { if (createdId) onCreated(); onClose() }}>
      <div className="space-y-3">
        {createdId && (
          <ImageCropUploader
            shape="circle"
            size={80}
            onUpload={(file) => uploadWrestlerPhotoAdmin(createdId, file)}
            label="Upload Photo"
          />
        )}
        <FieldRow label="Name *"><input className="w-full input-field" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. John Doe" disabled={!!createdId} /></FieldRow>
        <FieldRow label="Moniker"><input className="w-full input-field" value={form.moniker} onChange={e => setForm({...form, moniker: e.target.value})} placeholder='e.g. "The Phenomenal One"' disabled={!!createdId} /></FieldRow>
        <FieldRow label="Slug *"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="e.g. john-doe" disabled={!!createdId} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Birthplace"><input className="w-full input-field" value={form.birthplace} onChange={e => setForm({...form, birthplace: e.target.value})} placeholder="e.g. Gainesville, GA" disabled={!!createdId} /></FieldRow>
          <FieldRow label="Currently Residing In"><input className="w-full input-field" value={form.residence} onChange={e => setForm({...form, residence: e.target.value})} placeholder="e.g. Houston, TX" disabled={!!createdId} /></FieldRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Height"><input className="w-full input-field" value={form.height} onChange={e => setForm({...form, height: e.target.value})} placeholder="e.g. 6 ft 1 in" disabled={!!createdId} /></FieldRow>
          <FieldRow label="Weight"><input className="w-full input-field" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 218 lbs" disabled={!!createdId} /></FieldRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Birthday"><input className="w-full input-field" type="date" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} disabled={!!createdId} /></FieldRow>
          <FieldRow label="Debut Year"><input className="w-full input-field" type="number" value={form.debut_year} onChange={e => setForm({...form, debut_year: e.target.value})} placeholder="e.g. 2015" disabled={!!createdId} /></FieldRow>
        </div>
        <FieldRow label="Trainer"><input className="w-full input-field" value={form.trainer} onChange={e => setForm({...form, trainer: e.target.value})} placeholder="e.g. Tom Prichard" disabled={!!createdId} /></FieldRow>
        <FieldRow label="PWI Ranking"><input className="w-full input-field" type="number" value={form.pwi_ranking} onChange={e => setForm({...form, pwi_ranking: e.target.value})} placeholder="Optional" disabled={!!createdId} /></FieldRow>
        <FieldRow label="Bio"><textarea className="w-full input-field" rows={2} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Optional bio..." disabled={!!createdId} /></FieldRow>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Social Links</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="X / Twitter"><input className="w-full input-field" value={form.twitter_handle} onChange={e => setForm({...form, twitter_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="Instagram"><input className="w-full input-field" value={form.instagram_handle} onChange={e => setForm({...form, instagram_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="TikTok"><input className="w-full input-field" value={form.tiktok_handle} onChange={e => setForm({...form, tiktok_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="YouTube"><input className="w-full input-field" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/..." disabled={!!createdId} /></FieldRow>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {!createdId ? (
            <button onClick={handleCreate} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Create Wrestler</>}</button>
          ) : (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex-1">✓ Wrestler created! Upload a photo above or close this modal.</div>
          )}
          <button onClick={() => { if (createdId) onCreated(); onClose() }} className="btn btn-ghost text-sm">{createdId ? 'Done' : 'Cancel'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CreatePromotionModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', slug: '', city: '', state: '', website: '', description: '',
    twitter_handle: '', instagram_handle: '', tiktok_handle: '', facebook_url: '', youtube_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: autoSlug(name) })
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.slug.trim()) { alert('Name and slug are required'); return }
    setSaving(true)
    try {
      const data = await createPromotionAdmin({
        name: form.name.trim(), slug: form.slug.trim(),
        city: form.city || undefined, state: form.state || undefined,
        website: form.website || undefined, description: form.description || undefined,
      })
      setCreatedId(data.id)
      await updatePromotionAdmin(data.id, {
        twitter_handle: form.twitter_handle || null, instagram_handle: form.instagram_handle || null,
        tiktok_handle: form.tiktok_handle || null, facebook_url: form.facebook_url || null, youtube_url: form.youtube_url || null,
      })
      alert(`Created promotion: ${form.name}. You can now upload a logo or close.`)
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <Modal title="Create New Promotion" onClose={() => { if (createdId) onCreated(); onClose() }}>
      <div className="space-y-3">
        {createdId && (
          <ImageCropUploader
            shape="square"
            size={80}
            onUpload={(file) => uploadPromotionLogoAdmin(createdId, file)}
            label="Upload Logo"
          />
        )}
        <FieldRow label="Name *"><input className="w-full input-field" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. New Texas Pro Wrestling" disabled={!!createdId} /></FieldRow>
        <FieldRow label="Slug *"><input className="w-full input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="e.g. new-texas-pro-wrestling" disabled={!!createdId} /></FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="City"><input className="w-full input-field" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Houston" disabled={!!createdId} /></FieldRow>
          <FieldRow label="State"><input className="w-full input-field" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="e.g. TX" disabled={!!createdId} /></FieldRow>
        </div>
        <FieldRow label="Website"><input className="w-full input-field" value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://..." disabled={!!createdId} /></FieldRow>
        <FieldRow label="Description"><textarea className="w-full input-field" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional description..." disabled={!!createdId} /></FieldRow>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-sm font-medium text-foreground-muted mb-3">Social Links</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="X / Twitter"><input className="w-full input-field" value={form.twitter_handle} onChange={e => setForm({...form, twitter_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="Instagram"><input className="w-full input-field" value={form.instagram_handle} onChange={e => setForm({...form, instagram_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="TikTok"><input className="w-full input-field" value={form.tiktok_handle} onChange={e => setForm({...form, tiktok_handle: e.target.value})} placeholder="@handle" disabled={!!createdId} /></FieldRow>
            <FieldRow label="Facebook"><input className="w-full input-field" value={form.facebook_url} onChange={e => setForm({...form, facebook_url: e.target.value})} placeholder="https://facebook.com/..." disabled={!!createdId} /></FieldRow>
            <FieldRow label="YouTube"><input className="w-full input-field" value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="https://youtube.com/..." disabled={!!createdId} /></FieldRow>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {!createdId ? (
            <button onClick={handleCreate} disabled={saving} className="btn btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Create Promotion</>}</button>
          ) : (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex-1">✓ Promotion created! Upload a logo above or close this modal.</div>
          )}
          <button onClick={() => { if (createdId) onCreated(); onClose() }} className="btn btn-ghost text-sm">{createdId ? 'Done' : 'Cancel'}</button>
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

function GroupsManagerModal({ promoId, promoName, groups, onUpdate, onClose }: {
  promoId: string, promoName: string, groups: any[], onUpdate: (g: any[]) => void, onClose: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('tag_team')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const group = await createGroupAdmin({ promotion_id: promoId, name: newName.trim(), type: newType })
      onUpdate([...groups, group])
      setNewName(''); setNewType('tag_team'); setCreating(false)
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  async function handleDelete(groupId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await deleteGroupAdmin(groupId); onUpdate(groups.filter(g => g.id !== groupId)) }
    catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleRename(groupId: string, newName: string) {
    try {
      await updateGroupAdmin(groupId, { name: newName })
      onUpdate(groups.map(g => g.id === groupId ? { ...g, name: newName } : g))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleAddMember(groupId: string, wrestler: any) {
    try {
      const member = await addGroupMemberAdmin(groupId, wrestler.id)
      onUpdate(groups.map(g => g.id === groupId ? { ...g, promotion_group_members: [...(g.promotion_group_members || []), member] } : g))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  async function handleRemoveMember(groupId: string, memberId: string) {
    try {
      await removeGroupMemberAdmin(memberId)
      onUpdate(groups.map(g => g.id === groupId ? { ...g, promotion_group_members: g.promotion_group_members.filter((m: any) => m.id !== memberId) } : g))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  const typeLabel = (t: string) => t === 'tag_team' ? 'Tag Team' : t === 'trio' ? 'Trio' : 'Faction'
  const typeColor = (t: string) => t === 'tag_team' ? 'text-blue-400' : t === 'trio' ? 'text-purple-400' : 'text-green-400'

  return (
    <Modal title={`Groups: ${promoName}`} onClose={onClose}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {groups.length === 0 && !creating && (
          <p className="text-foreground-muted text-sm">No tag teams or factions yet.</p>
        )}

        {groups.map((group: any) => (
          <GroupItemAdmin
            key={group.id}
            group={group}
            onRename={(name) => handleRename(group.id, name)}
            onDelete={() => handleDelete(group.id, group.name)}
            onAddMember={(w) => handleAddMember(group.id, w)}
            onRemoveMember={(memberId) => handleRemoveMember(group.id, memberId)}
          />
        ))}

        {creating ? (
          <div className="p-3 border border-border rounded-lg space-y-3">
            <FieldRow label="Group Name">
              <input className="w-full input-field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. The Dynasty" />
            </FieldRow>
            <FieldRow label="Type">
              <select className="w-full input-field" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="tag_team">Tag Team (2)</option>
                <option value="trio">Trio (3)</option>
                <option value="stable">Faction (3+)</option>
              </select>
            </FieldRow>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving || !newName.trim()} className="btn btn-primary text-xs">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" /> Create</>}
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }} className="btn btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="btn btn-secondary text-xs w-full">
            <Plus className="w-3 h-3 mr-1" /> Add Tag Team / Faction
          </button>
        )}
      </div>
    </Modal>
  )
}

function GroupItemAdmin({ group, onRename, onDelete, onAddMember, onRemoveMember }: {
  group: any, onRename: (name: string) => void, onDelete: () => void,
  onAddMember: (w: any) => void, onRemoveMember: (memberId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const members = group.promotion_group_members || []
  const memberIds = new Set(members.map((m: any) => m.wrestler_id))
  const typeLabel = group.type === 'tag_team' ? 'Tag Team' : group.type === 'trio' ? 'Trio' : 'Faction'
  const typeColor = group.type === 'tag_team' ? 'text-blue-400 bg-blue-500/10' : group.type === 'trio' ? 'text-purple-400 bg-purple-500/10' : 'text-green-400 bg-green-500/10'

  async function handleMemberSearch(query: string) {
    setMemberSearch(query)
    if (!query.trim()) { setMemberResults([]); return }
    const data = await searchWrestlersAdmin(query, 5)
    setMemberResults(data.filter((w: any) => !memberIds.has(w.id)))
  }

  return (
    <div className="p-3 bg-background-tertiary rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex-1 flex gap-2">
            <input className="flex-1 input-field text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
            <button onClick={() => { onRename(editName); setEditing(false) }} className="btn btn-primary text-xs p-1.5"><Save className="w-3 h-3" /></button>
            <button onClick={() => { setEditing(false); setEditName(group.name) }} className="btn btn-ghost text-xs p-1.5"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <>
            <span className="font-semibold text-sm flex-1">{group.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
            <button onClick={() => setEditing(true)} className="p-1 text-foreground-muted hover:text-accent rounded"><Edit3 className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3" /></button>
          </>
        )}
      </div>

      {/* Members list */}
      <div className="flex flex-wrap gap-1.5">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs">
            <span>{m.wrestlers?.name || 'Unknown'}</span>
            <button onClick={() => onRemoveMember(m.id)} className="text-red-400 hover:text-red-300 ml-1"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs hover:bg-accent/20">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Member search */}
      {showSearch && (
        <div className="relative">
          <input className="w-full input-field text-sm" value={memberSearch} onChange={e => handleMemberSearch(e.target.value)} placeholder="Search wrestler to add..." autoFocus />
          {memberResults.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
              {memberResults.map((w: any) => (
                <button key={w.id} onClick={() => { onAddMember(w); setMemberSearch(''); setMemberResults([]); setShowSearch(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-background-tertiary">{w.name}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RosterManagerModal({ promoId, promoName, roster, onUpdate, onClose }: {
  promoId: string, promoName: string, roster: any[], onUpdate: (r: any[]) => void, onClose: () => void
}) {
  const [addSearch, setAddSearch] = useState('')
  const [addResults, setAddResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleSearch(query: string) {
    setAddSearch(query)
    if (!query.trim()) { setAddResults([]); return }
    setSearching(true)
    const data = await searchWrestlersAdmin(query, 8)
    // Filter out wrestlers already on roster
    const rosterIds = new Set(roster.map(r => r.wrestlers?.id || r.wrestler_id))
    setAddResults(data.filter((w: any) => !rosterIds.has(w.id)))
    setSearching(false)
  }

  async function handleAdd(wrestler: any) {
    setAdding(true)
    try {
      const member = await addToRosterAdmin(promoId, wrestler.id)
      onUpdate([...roster, member])
      setAddSearch('')
      setAddResults([])
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setAdding(false)
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the roster?`)) return
    try {
      await removeFromRosterAdmin(memberId)
      onUpdate(roster.filter(r => r.id !== memberId))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <Modal title={`Roster: ${promoName} (${roster.length})`} onClose={onClose}>
      <div className="space-y-3">
        {/* Add wrestler search */}
        <div className="relative">
          <input
            className="w-full input-field text-sm"
            value={addSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search wrestler to add..."
          />
          {addResults.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {addResults.map((w: any) => (
                <button key={w.id} onClick={() => handleAdd(w)} disabled={adding}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-background-tertiary transition-colors flex items-center gap-2">
                  <Plus className="w-3 h-3 text-attending" />
                  {w.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Roster list */}
        {roster.length === 0 ? (
          <p className="text-foreground-muted text-sm">No wrestlers on roster.</p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {roster.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{member.wrestlers?.name || 'Unknown'}</span>
                </div>
                <button onClick={() => handleRemove(member.id, member.wrestlers?.name || 'wrestler')}
                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors flex-shrink-0" title="Remove">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function ChampionshipsManagerModal({ promoId, promoName, championships, onUpdate, onClose }: {
  promoId: string, promoName: string, championships: any[], onUpdate: (c: any[]) => void, onClose: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIsTag, setNewIsTag] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const champ = await createChampionshipAdmin({
        promotion_id: promoId,
        name: newName.trim(),
        is_tag_team: newIsTag,
        sort_order: championships.length,
      })
      onUpdate([...championships, champ])
      setNewName('')
      setNewIsTag(false)
      setCreating(false)
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  async function handleDelete(champId: string, champName: string) {
    if (!confirm(`Delete "${champName}"? This cannot be undone.`)) return
    try {
      await deleteChampionshipAdmin(champId)
      onUpdate(championships.filter(c => c.id !== champId))
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  return (
    <Modal title={`Championships: ${promoName}`} onClose={onClose}>
      <div className="space-y-3">
        {championships.length === 0 && !creating && (
          <p className="text-foreground-muted text-sm">No championships yet.</p>
        )}

        {championships.map((c: any) => (
          <div key={c.id}>
            {editingId === c.id ? (
              <EditChampionshipInline
                championship={c}
                onSaved={(updated) => {
                  onUpdate(championships.map(ch => ch.id === updated.id ? updated : ch))
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg">
                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {c.is_tag_team ? 'Tag Team' : 'Singles'}
                    {c.current_champion ? ` • ${c.current_champion.name}` : ' • Vacant'}
                    {c.current_champion_2 && ` & ${c.current_champion_2.name}`}
                    {c.won_date && ` (since ${c.won_date})`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditingId(c.id)} className="p-1.5 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {creating ? (
          <div className="p-3 border border-border rounded-lg space-y-3">
            <FieldRow label="Championship Name">
              <input className="w-full input-field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. World Heavyweight Championship" />
            </FieldRow>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newIsTag} onChange={e => setNewIsTag(e.target.checked)} className="rounded" />
              Tag Team Championship
            </label>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving || !newName.trim()} className="btn btn-primary text-xs">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" /> Create</>}
              </button>
              <button onClick={() => { setCreating(false); setNewName(''); setNewIsTag(false) }} className="btn btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="btn btn-secondary text-xs w-full">
            <Plus className="w-3 h-3 mr-1" /> Add Championship
          </button>
        )}
      </div>
    </Modal>
  )
}

function EditChampionshipInline({ championship, onSaved, onCancel }: { championship: any, onSaved: (c: any) => void, onCancel: () => void }) {
  const [name, setName] = useState(championship.name || '')
  const [isTag, setIsTag] = useState(championship.is_tag_team || false)
  const [wonDate, setWonDate] = useState(championship.won_date || '')
  const [saving, setSaving] = useState(false)

  // Champion search
  const [champSearch, setChampSearch] = useState('')
  const [champResults, setChampResults] = useState<any[]>([])
  const [champSearching, setChampSearching] = useState(false)
  const [selectedChamp, setSelectedChamp] = useState<any>(championship.current_champion || null)
  const [selectedChamp2, setSelectedChamp2] = useState<any>(championship.current_champion_2 || null)

  // Partner search (for tag teams)
  const [partnerSearch, setPartnerSearch] = useState('')
  const [partnerResults, setPartnerResults] = useState<any[]>([])
  const [partnerSearching, setPartnerSearching] = useState(false)

  async function searchChamp(query: string) {
    if (!query.trim()) { setChampResults([]); return }
    setChampSearching(true)
    const data = await searchWrestlersAdmin(query, 5)
    setChampResults(data)
    setChampSearching(false)
  }

  async function searchPartner(query: string) {
    if (!query.trim()) { setPartnerResults([]); return }
    setPartnerSearching(true)
    const data = await searchWrestlersAdmin(query, 5)
    setPartnerResults(data)
    setPartnerSearching(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateChampionshipAdmin(championship.id, {
        name, is_tag_team: isTag,
        current_champion_id: selectedChamp?.id || null,
        current_champion_2_id: isTag ? (selectedChamp2?.id || null) : null,
        won_date: wonDate || null,
      })
      onSaved(updated)
    } catch (err: any) { alert(`Error: ${err.message}`) }
    setSaving(false)
  }

  return (
    <div className="p-3 border border-accent/30 rounded-lg space-y-3 bg-background-tertiary/50">
      <FieldRow label="Championship Name">
        <input className="w-full input-field text-sm" value={name} onChange={e => setName(e.target.value)} />
      </FieldRow>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isTag} onChange={e => setIsTag(e.target.checked)} className="rounded" />
        Tag Team Championship
      </label>

      {/* Champion 1 */}
      <div>
        <label className="block text-sm font-medium text-foreground-muted mb-1">
          {isTag ? 'Champion 1' : 'Current Champion'}
        </label>
        {selectedChamp ? (
          <div className="flex items-center gap-2 p-2 bg-background-tertiary rounded-lg">
            <span className="text-sm font-medium flex-1">{selectedChamp.name}</span>
            <button onClick={() => setSelectedChamp(null)} className="text-foreground-muted hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="relative">
            <input
              className="w-full input-field text-sm"
              value={champSearch}
              onChange={e => { setChampSearch(e.target.value); searchChamp(e.target.value) }}
              placeholder="Search wrestler..."
            />
            {champResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {champResults.map(w => (
                  <button key={w.id} onClick={() => { setSelectedChamp(w); setChampSearch(''); setChampResults([]) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-background-tertiary transition-colors">{w.name}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Champion 2 (tag teams) */}
      {isTag && (
        <div>
          <label className="block text-sm font-medium text-foreground-muted mb-1">Champion 2</label>
          {selectedChamp2 ? (
            <div className="flex items-center gap-2 p-2 bg-background-tertiary rounded-lg">
              <span className="text-sm font-medium flex-1">{selectedChamp2.name}</span>
              <button onClick={() => setSelectedChamp2(null)} className="text-foreground-muted hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="w-full input-field text-sm"
                value={partnerSearch}
                onChange={e => { setPartnerSearch(e.target.value); searchPartner(e.target.value) }}
                placeholder="Search wrestler..."
              />
              {partnerResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-secondary border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {partnerResults.map(w => (
                    <button key={w.id} onClick={() => { setSelectedChamp2(w); setPartnerSearch(''); setPartnerResults([]) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-background-tertiary transition-colors">{w.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <FieldRow label="Won Date">
        <input type="date" className="w-full input-field text-sm" value={wonDate} onChange={e => setWonDate(e.target.value)} />
      </FieldRow>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn btn-primary text-xs">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Save</>}
        </button>
        <button onClick={onCancel} className="btn btn-ghost text-xs">Cancel</button>
        <button onClick={() => { setSelectedChamp(null); setSelectedChamp2(null) }} className="btn btn-ghost text-xs text-yellow-500">Vacate</button>
      </div>
    </div>
  )
}

function ClaimCodeSection({ type, id, currentCode, claimedBy }: { type: 'wrestlers' | 'promotions', id: string, currentCode?: string, claimedBy?: string }) {
  const [code, setCode] = useState(currentCode || '')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += '-'
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }

  async function handleGenerate() {
    setGenerating(true)
    const newCode = generateCode()
    try {
      const supabase = (await import('@/lib/supabase-browser')).createClient()
      const { error } = await supabase.from(type).update({ claim_code: newCode }).eq('id', id)
      if (error) throw error
      setCode(newCode)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setGenerating(false)
  }

  async function handleRevoke() {
    try {
      const supabase = (await import('@/lib/supabase-browser')).createClient()
      const { error } = await supabase.from(type).update({ claim_code: null }).eq('id', id)
      if (error) throw error
      setCode('')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (claimedBy) {
    return (
      <div className="border-t border-border pt-3 mt-3">
        <p className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2"><Key className="w-4 h-4" /> Claim Code</p>
        <p className="text-xs text-attending">Already claimed — no code needed.</p>
      </div>
    )
  }

  return (
    <div className="border-t border-border pt-3 mt-3">
      <p className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2"><Key className="w-4 h-4" /> Claim Code</p>
      {code ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-background-tertiary rounded-lg font-mono text-sm tracking-wider text-accent">{code}</code>
          <button onClick={handleCopy} className="btn btn-ghost text-xs p-2" title="Copy">
            {copied ? <CheckCircle className="w-4 h-4 text-attending" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleRevoke} className="btn btn-ghost text-xs p-2 text-red-400" title="Revoke">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={generating} className="btn btn-secondary text-xs">
          {generating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Generate Claim Code
        </button>
      )}
      <p className="text-xs text-foreground-muted mt-1">DM this code to the {type === 'wrestlers' ? 'wrestler' : 'promoter'} for instant profile claiming.</p>
    </div>
  )
}

// ============================================
// PAGE REQUESTS TAB
// ============================================

function PageRequestsTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    loadRequests()
  }, [filter])

  async function loadRequests() {
    setLoading(true)
    const supabase = (await import('@/lib/supabase-browser')).createClient()
    let query = supabase
      .from('page_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'pending') {
      query = query.eq('status', 'pending')
    }

    const { data, error } = await query
    if (error) console.error('Error loading requests:', error)
    setRequests(data || [])
    setLoading(false)
  }

  async function handleUpdateStatus(id: string, status: string) {
    const supabase = (await import('@/lib/supabase-browser')).createClient()
    
    // If approving, create the wrestler/promotion record
    if (status === 'approved') {
      const req = requests.find(r => r.id === id)
      if (!req) return

      const slug = req.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      if (req.type === 'wrestler') {
        // Check if wrestler already exists with this name
        const { data: existing } = await supabase
          .from('wrestlers')
          .select('id')
          .ilike('name', req.name.trim())
          .maybeSingle()

        if (existing) {
          // Wrestler exists — just claim it for the requester
          if (req.requested_by) {
            await supabase.from('wrestlers').update({ claimed_by: req.requested_by }).eq('id', existing.id)
          }
        } else {
          // Create new wrestler
          const { data: newWrestler, error: createErr } = await supabase
            .from('wrestlers')
            .insert({
              name: req.name.trim(),
              slug,
              claimed_by: req.requested_by || null,
              verification_status: req.requested_by ? 'pending' : 'unverified',
            })
            .select('id')
            .single()

          if (createErr) {
            alert(`Error creating wrestler: ${createErr.message}`)
            return
          }
        }
      } else if (req.type === 'promotion') {
        // Check if promotion already exists
        const { data: existing } = await supabase
          .from('promotions')
          .select('id')
          .ilike('name', req.name.trim())
          .maybeSingle()

        if (existing) {
          // Promotion exists — create a claim for the requester
          if (req.requested_by) {
            await supabase.from('promotion_claims').insert({
              promotion_id: existing.id,
              user_id: req.requested_by,
              status: 'approved',
              role: 'owner',
            }).select().maybeSingle()
          }
        } else {
          // Create new promotion
          const { data: newPromo, error: createErr } = await supabase
            .from('promotions')
            .insert({
              name: req.name.trim(),
              slug,
              country: 'USA',
              region: 'South',
            })
            .select('id')
            .single()

          if (createErr) {
            alert(`Error creating promotion: ${createErr.message}`)
            return
          }

          // Create claim for requester
          if (req.requested_by && newPromo) {
            await supabase.from('promotion_claims').insert({
              promotion_id: newPromo.id,
              user_id: req.requested_by,
              status: 'approved',
              role: 'owner',
            }).select().maybeSingle()
          }
        }
      }
    }

    // Update the request status
    const { error } = await supabase.from('page_requests').update({ status }).eq('id', id)
    if (error) { alert(`Error: ${error.message}`); return }
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this request?')) return
    const supabase = (await import('@/lib/supabase-browser')).createClient()
    const { error } = await supabase.from('page_requests').delete().eq('id', id)
    if (error) { alert(`Error: ${error.message}`); return }
    setRequests(requests.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Inbox className="w-5 h-5" /> Page Requests ({requests.length})
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setFilter('pending')} className={`text-sm px-3 py-1.5 rounded-lg ${filter === 'pending' ? 'bg-accent text-white' : 'bg-background-tertiary text-foreground-muted'}`}>Pending</button>
          <button onClick={() => setFilter('all')} className={`text-sm px-3 py-1.5 rounded-lg ${filter === 'all' ? 'bg-accent text-white' : 'bg-background-tertiary text-foreground-muted'}`}>All</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-foreground-muted" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-foreground-muted">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No {filter === 'pending' ? 'pending ' : ''}page requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  req.type === 'wrestler' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {req.type === 'wrestler' ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{req.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.type === 'wrestler' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>{req.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400'
                        : req.status === 'approved' ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>{req.status}</span>
                  </div>
                  {req.details && <p className="text-sm text-foreground-muted mt-1">{req.details}</p>}
                  {req.social_links && <p className="text-xs text-accent mt-1">{req.social_links}</p>}
                  <p className="text-xs text-foreground-muted mt-1">
                    By {req.requested_by_email || 'Unknown'} &middot; {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="p-2 rounded text-green-400 hover:bg-green-500/10 transition-colors" title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="p-2 rounded text-red-400 hover:bg-red-500/10 transition-colors" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(req.id)} className="p-2 rounded text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
