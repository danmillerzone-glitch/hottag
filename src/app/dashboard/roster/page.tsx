'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getPromoterPromotion, getPromotionRoster, getPromotionChampionships,
  addToRoster, removeFromRoster, createChampionship, updateChampionship,
  deleteChampionship, searchWrestlers,
  getPromotionGroups, createGroup, updateGroup, deleteGroup,
  addGroupMember, removeGroupMember,
  type RosterMember, type Championship, type PromotionGroup,
} from '@/lib/promoter'
import {
  Loader2, ArrowLeft, Plus, Trash2, Search, X, User, Trophy, Users, Crown, Check, Save, Edit3, EyeOff, ChevronUp, ChevronDown, ArrowDownAZ, Shield,
} from 'lucide-react'

export default function RosterPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [promotion, setPromotion] = useState<any>(null)
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [groups, setGroups] = useState<PromotionGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/signin'); return }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    setLoading(true)
    const promo = await getPromoterPromotion()
    if (!promo) { router.push('/dashboard'); return }
    setPromotion(promo)
    const [rosterData, champsData, groupsData] = await Promise.all([
      getPromotionRoster(promo.id),
      getPromotionChampionships(promo.id),
      getPromotionGroups(promo.id),
    ])
    setRoster(rosterData)
    setChampionships(champsData)
    setGroups(groupsData)
    setLoading(false)
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  }
  if (!promotion) return null

  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-display font-bold">Roster & Championships</h1>
          <p className="text-sm text-foreground-muted mt-1">{promotion.name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <ChampionshipsSection
          promotionId={promotion.id}
          championships={championships}
          roster={roster}
          groups={groups}
          onUpdate={setChampionships}
        />
        <GroupsSection
          promotionId={promotion.id}
          groups={groups}
          onUpdate={setGroups}
        />
        <RosterSection
          promotionId={promotion.id}
          roster={roster}
          onUpdate={setRoster}
        />
      </div>
    </div>
  )
}

// ============================================
// CHAMPIONSHIPS SECTION
// ============================================

function ChampionshipsSection({ promotionId, championships, roster, groups, onUpdate }: {
  promotionId: string
  championships: Championship[]
  roster: RosterMember[]
  groups: PromotionGroup[]
  onUpdate: (c: Championship[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newShortName, setNewShortName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName) return
    setAdding(true)
    try {
      const champ = await createChampionship({
        promotion_id: promotionId,
        name: newName,
        short_name: newShortName || undefined,
        sort_order: championships.length,
      })
      onUpdate([...championships, { ...champ, current_champion: null, current_champion_2: null }])
      setNewName(''); setNewShortName(''); setShowAdd(false)
    } catch (err) { console.error('Error creating championship:', err) }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this championship?')) return
    try { await deleteChampionship(id); onUpdate(championships.filter(c => c.id !== id)) }
    catch (err) { console.error('Error deleting:', err) }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= championships.length) return

    const newOrder = [...championships]
    const temp = newOrder[index]
    newOrder[index] = newOrder[swapIndex]
    newOrder[swapIndex] = temp

    // Update sort_order for both
    onUpdate(newOrder)
    try {
      await Promise.all([
        updateChampionship(newOrder[index].id, { sort_order: index }),
        updateChampionship(newOrder[swapIndex].id, { sort_order: swapIndex }),
      ])
    } catch (err) { console.error('Error reordering:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Championships</h2>
          <span className="text-sm text-foreground-muted">({championships.length})</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Title
        </button>
      </div>

      {championships.length > 0 ? (
        <div className="space-y-4">
          {championships.map((champ, index) => (
            <div key={champ.id} className="flex gap-2">
              {/* Move arrows */}
              <div className="flex flex-col justify-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-background text-foreground-muted hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === championships.length - 1}
                  className="p-1 rounded hover:bg-background text-foreground-muted hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <ChampionshipItem championship={champ} roster={roster} groups={groups} onUpdate={(updated) => {
                  onUpdate(championships.map(c => c.id === updated.id ? updated : c))
                }} onDelete={() => handleDelete(champ.id)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Trophy className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">No championships added yet.</p>
        </div>
      )}

      {showAdd && (
        <div className="mt-4 p-4 rounded-lg bg-background-tertiary border border-border space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Championship Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder='e.g., "World Heavyweight Championship"'
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Name <span className="text-foreground-muted">(optional)</span></label>
            <input type="text" value={newShortName} onChange={(e) => setNewShortName(e.target.value)} placeholder='e.g., "World Title"'
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewShortName('') }} className="btn btn-ghost text-sm">Cancel</button>
            <button onClick={handleAdd} disabled={adding || !newName} className="btn btn-primary text-sm">
              {adding ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4 mr-1.5" /> Create Title</>}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function ChampionshipItem({ championship, roster, groups, onUpdate, onDelete }: {
  championship: Championship
  roster: RosterMember[]
  groups: PromotionGroup[]
  onUpdate: (c: Championship) => void
  onDelete: () => void
}) {
  const [showChampSearch, setShowChampSearch] = useState(false)
  const [settingPartner, setSettingPartner] = useState(false)
  const [showGroupSelect, setShowGroupSelect] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editing states
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(championship.name)
  const [editShortName, setEditShortName] = useState(championship.short_name || '')
  const [editWonDate, setEditWonDate] = useState(championship.won_date || '')

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchWrestlers(query)
    setSearchResults(results)
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleSetChampion = async (wrestlerId: string, wrestlerData: any) => {
    setSaving(true)
    try {
      if (settingPartner) {
        await updateChampionship(championship.id, { current_champion_2_id: wrestlerId })
        onUpdate({ ...championship, current_champion_2_id: wrestlerId, current_champion_2: wrestlerData })
      } else {
        await updateChampionship(championship.id, {
          current_champion_id: wrestlerId,
          current_champion_2_id: null,
          champion_group_id: null,
          won_date: new Date().toISOString().split('T')[0],
        })
        onUpdate({
          ...championship,
          current_champion_id: wrestlerId,
          current_champion: wrestlerData,
          current_champion_2_id: null,
          current_champion_2: null,
          champion_group_id: null,
          champion_group: null,
          won_date: new Date().toISOString().split('T')[0],
        })
      }
      setShowChampSearch(false); setSettingPartner(false); setSearchQuery(''); setSearchResults([])
    } catch (err) { console.error('Error setting champion:', err) }
    setSaving(false)
  }

  const handleSetGroupChampion = async (group: PromotionGroup) => {
    setSaving(true)
    try {
      await updateChampionship(championship.id, {
        champion_group_id: group.id,
        current_champion_id: null,
        current_champion_2_id: null,
        won_date: new Date().toISOString().split('T')[0],
      })
      onUpdate({
        ...championship,
        champion_group_id: group.id,
        champion_group: group as any,
        current_champion_id: null,
        current_champion: null,
        current_champion_2_id: null,
        current_champion_2: null,
        won_date: new Date().toISOString().split('T')[0],
      })
      setShowGroupSelect(false)
    } catch (err) { console.error('Error setting group champion:', err) }
    setSaving(false)
  }

  const handleVacate = async () => {
    if (!confirm('Vacate this championship?')) return
    setSaving(true)
    try {
      await updateChampionship(championship.id, { current_champion_id: null, current_champion_2_id: null, champion_group_id: null })
      onUpdate({ ...championship, current_champion_id: null, current_champion: null, current_champion_2_id: null, current_champion_2: null, champion_group_id: null, champion_group: null })
    } catch (err) { console.error('Error vacating:', err) }
    setSaving(false)
  }

  const handleSaveEdits = async () => {
    setSaving(true)
    try {
      await updateChampionship(championship.id, {
        name: editName,
        short_name: editShortName || null,
        won_date: editWonDate || null,
      })
      onUpdate({ ...championship, name: editName, short_name: editShortName || null, won_date: editWonDate || null })
      setEditing(false)
    } catch (err) { console.error('Error saving edits:', err) }
    setSaving(false)
  }

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this championship? It will be hidden from the public page.')) return
    setSaving(true)
    try {
      await updateChampionship(championship.id, { is_active: false })
      onDelete()
    } catch (err) { console.error('Error deactivating:', err) }
    setSaving(false)
  }

  const champ = championship.current_champion
  const champ2 = championship.current_champion_2
  const champGroup = championship.champion_group
  const hasChampion = !!(champ || champGroup)

  return (
    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Title Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Short Name</label>
                <input type="text" value={editShortName} onChange={(e) => setEditShortName(e.target.value)} placeholder="Optional"
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Championship Won Date</label>
                <input type="date" value={editWonDate} onChange={(e) => setEditWonDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none transition-colors text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdits} disabled={saving || !editName} className="btn btn-primary text-xs">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Save</>}
                </button>
                <button onClick={() => {
                  setEditing(false); setEditName(championship.name)
                  setEditShortName(championship.short_name || ''); setEditWonDate(championship.won_date || '')
                }} className="btn btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-interested" />
                <span className="font-semibold">{championship.name}</span>
              </div>
              {championship.short_name && <span className="text-xs text-foreground-muted ml-6">{championship.short_name}</span>}
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-background text-foreground-muted hover:text-foreground transition-colors" title="Edit title">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleDeactivate} className="p-1.5 rounded hover:bg-yellow-500/10 text-foreground-muted hover:text-yellow-400 transition-colors" title="Deactivate">
              <EyeOff className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Group champion display */}
      {champGroup ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border mb-2">
          <div className="flex -space-x-2 flex-shrink-0">
            {champGroup.promotion_group_members?.map((m: any) => (
              <div key={m.id} className="w-10 h-10 rounded-xl bg-background-tertiary border-2 border-interested flex items-center justify-center overflow-hidden">
                {m.wrestlers?.photo_url ? (
                  <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-5 h-5 text-foreground-muted" />
                )}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{champGroup.name}</div>
            <div className="text-xs text-foreground-muted">
              {champGroup.promotion_group_members?.map((m: any) => m.wrestlers?.name).filter(Boolean).join(', ')}
            </div>
            {championship.won_date && (
              <div className="text-xs text-foreground-muted">
                Since {new Date(championship.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => { setShowChampSearch(true); setSettingPartner(false) }} className="text-xs text-accent hover:text-accent-hover">Change</button>
            <span className="text-foreground-muted/30">·</span>
            <button onClick={handleVacate} className="text-xs text-red-400 hover:text-red-300">Vacate</button>
          </div>
        </div>
      ) : champ ? (
        /* Individual champion display */
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border mb-2">
          <div className="flex -space-x-2 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-background-tertiary border-2 border-interested flex items-center justify-center overflow-hidden">
              {champ.photo_url ? (
                <Image src={champ.photo_url} alt={champ.name} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <User className="w-6 h-6 text-foreground-muted" />
              )}
            </div>
            {champ2 && (
              <div className="w-12 h-12 rounded-xl bg-background-tertiary border-2 border-interested flex items-center justify-center overflow-hidden">
                {champ2.photo_url ? (
                  <Image src={champ2.photo_url} alt={champ2.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-6 h-6 text-foreground-muted" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div>
              <Link href={`/wrestlers/${champ.slug}`} className="font-semibold hover:text-accent transition-colors">
                {champ.name}
              </Link>
              {champ2 && (
                <> <span className="text-foreground-muted">&amp;</span> <Link href={`/wrestlers/${champ2.slug}`} className="font-semibold hover:text-accent transition-colors">{champ2.name}</Link></>
              )}
            </div>
            {championship.won_date && (
              <div className="text-xs text-foreground-muted">
                Champion since {new Date(championship.won_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => { setSettingPartner(false); setShowChampSearch(true) }} className="text-xs text-accent hover:text-accent-hover transition-colors">Change</button>
            <span className="text-foreground-muted/30">·</span>
            {!champ2 && (
              <>
                <button onClick={() => { setSettingPartner(true); setShowChampSearch(true) }} className="text-xs text-accent hover:text-accent-hover transition-colors">Add Partner</button>
                <span className="text-foreground-muted/30">·</span>
              </>
            )}
            {champ2 && (
              <>
                <button onClick={async () => {
                  await updateChampionship(championship.id, { current_champion_2_id: null })
                  onUpdate({ ...championship, current_champion_2_id: null, current_champion_2: null })
                }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove Partner</button>
                <span className="text-foreground-muted/30">·</span>
              </>
            )}
            <button onClick={handleVacate} className="text-xs text-red-400 hover:text-red-300 transition-colors">Vacate</button>
          </div>
        </div>
      ) : (
        /* Vacant */
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-dashed border-border mb-2">
          <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center"><Trophy className="w-5 h-5 text-foreground-muted/30" /></div>
          <div className="flex-1">
            <span className="text-foreground-muted text-sm">Vacant</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowChampSearch(true)} className="btn btn-secondary text-xs">Set Champion</button>
            {groups.length > 0 && (
              <button onClick={() => setShowGroupSelect(true)} className="btn btn-ghost text-xs"><Shield className="w-3 h-3 mr-1" /> Set Team</button>
            )}
          </div>
        </div>
      )}

      {/* Group selection */}
      {showGroupSelect && (
        <div className="p-3 rounded-lg bg-background border border-border mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Select a Tag Team / Faction</span>
            <button onClick={() => setShowGroupSelect(false)} className="p-1 rounded hover:bg-background-tertiary"><X className="w-4 h-4 text-foreground-muted" /></button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {groups.map(g => (
              <button key={g.id} onClick={() => handleSetGroupChampion(g)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-tertiary transition-colors text-left text-sm">
                <Shield className="w-4 h-4 text-purple-400" />
                <div className="flex-1">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-foreground-muted">{g.promotion_group_members?.map((m: any) => m.wrestlers?.name).filter(Boolean).join(', ')}</div>
                </div>
                <span className="text-[10px] text-foreground-muted">{g.type === 'tag_team' ? 'Tag' : g.type === 'trio' ? 'Trio' : 'Faction'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Champion search */}
      {showChampSearch && (
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search wrestlers..." autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
            </div>
            <button onClick={() => { setShowChampSearch(false); setSearchQuery(''); setSearchResults([]) }} className="p-2 rounded hover:bg-background-tertiary">
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
          {/* Show group options in wrestler search too */}
          {!settingPartner && groups.length > 0 && searchQuery.length < 2 && (
            <div className="mb-2 pb-2 border-b border-border">
              <p className="text-xs text-foreground-muted mb-1">Or set a team as champion:</p>
              <div className="flex flex-wrap gap-1">
                {groups.map(g => (
                  <button key={g.id} onClick={() => { handleSetGroupChampion(g); setShowChampSearch(false) }}
                    className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">
                    <Shield className="w-3 h-3 inline mr-1" />{g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((w: any) => (
                <button key={w.id} onClick={() => handleSetChampion(w.id, { id: w.id, name: w.name, slug: w.slug, photo_url: w.photo_url })}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-tertiary transition-colors text-left text-sm">
                  {w.photo_url ? <Image src={w.photo_url} alt={w.name} width={24} height={24} className="w-6 h-6 rounded-md object-cover" /> : <User className="w-5 h-5 text-foreground-muted" />}
                  <span>{w.name}</span>
                  {w.hometown && <span className="text-xs text-foreground-muted ml-auto">{w.hometown}</span>}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && <p className="text-xs text-foreground-muted text-center py-2">No wrestlers found.</p>}
          {searching && <div className="flex items-center justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-foreground-muted" /></div>}
        </div>
      )}
    </div>
  )
}

// ============================================
// GROUPS SECTION (Tag Teams & Factions)
// ============================================

function GroupsSection({ promotionId, groups, onUpdate }: {
  promotionId: string
  groups: PromotionGroup[]
  onUpdate: (g: PromotionGroup[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('tag_team')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const group = await createGroup({ promotion_id: promotionId, name: newName.trim(), type: newType })
      onUpdate([...groups, group])
      setNewName(''); setNewType('tag_team'); setShowAdd(false)
    } catch (err: any) { console.error('Error creating group:', err); alert(err?.message || 'Failed') }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return
    try { await deleteGroup(id); onUpdate(groups.filter(g => g.id !== id)) }
    catch (err) { console.error('Error deleting group:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-display font-bold">Tag Teams &amp; Factions</h2>
          <span className="text-sm text-foreground-muted">({groups.length})</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Group
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map(group => (
            <GroupItem key={group.id} group={group} promotionId={promotionId}
              onUpdate={(updated) => onUpdate(groups.map(g => g.id === updated.id ? updated : g))}
              onDelete={() => handleDelete(group.id)} />
          ))}
        </div>
      ) : !showAdd && (
        <div className="py-8 text-center">
          <Shield className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">No tag teams or factions yet.</p>
        </div>
      )}

      {showAdd && (
        <div className="mt-4 p-4 rounded-lg bg-background-tertiary border border-border space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder='e.g., "The Dynasty"'
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none transition-colors text-sm">
              <option value="tag_team">Tag Team (2)</option>
              <option value="trio">Trio (3)</option>
              <option value="stable">Faction (3+)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAdd(false); setNewName('') }} className="btn btn-ghost text-sm">Cancel</button>
            <button onClick={handleAdd} disabled={adding || !newName.trim()} className="btn btn-primary text-sm">
              {adding ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4 mr-1.5" /> Create</>}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function GroupItem({ group, promotionId, onUpdate, onDelete }: {
  group: PromotionGroup
  promotionId: string
  onUpdate: (g: PromotionGroup) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [editType, setEditType] = useState(group.type)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const members = group.promotion_group_members || []
  const memberIds = new Set(members.map(m => m.wrestler_id))
  const typeLabel = group.type === 'tag_team' ? 'Tag Team' : group.type === 'trio' ? 'Trio' : 'Faction'
  const typeColor = group.type === 'tag_team' ? 'text-blue-400 bg-blue-500/10' : group.type === 'trio' ? 'text-purple-400 bg-purple-500/10' : 'text-green-400 bg-green-500/10'

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchWrestlers(query)
    setSearchResults(results.filter((w: any) => !memberIds.has(w.id)))
    setSearching(false)
  }, [memberIds])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleAddMember = async (wrestler: any) => {
    try {
      const member = await addGroupMember(group.id, wrestler.id)
      onUpdate({ ...group, promotion_group_members: [...members, member] })
      setSearchQuery(''); setSearchResults([]); setShowAddMember(false)
    } catch (err: any) { console.error('Error adding member:', err); alert(err?.message || 'Failed') }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeGroupMember(memberId)
      onUpdate({ ...group, promotion_group_members: members.filter(m => m.id !== memberId) })
    } catch (err) { console.error('Error removing member:', err) }
  }

  const handleSaveEdits = async () => {
    setSaving(true)
    try {
      await updateGroup(group.id, { name: editName, type: editType })
      onUpdate({ ...group, name: editName, type: editType as any })
      setEditing(false)
    } catch (err) { console.error('Error updating group:', err) }
    setSaving(false)
  }

  return (
    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {editing ? (
          <div className="flex-1 space-y-2 mr-2">
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none text-sm" />
            <select value={editType} onChange={(e) => setEditType(e.target.value as 'tag_team' | 'trio' | 'stable')}
              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none text-sm">
              <option value="tag_team">Tag Team</option>
              <option value="trio">Trio</option>
              <option value="stable">Faction</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleSaveEdits} disabled={saving || !editName} className="btn btn-primary text-xs">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Save</>}
              </button>
              <button onClick={() => { setEditing(false); setEditName(group.name); setEditType(group.type) }} className="btn btn-ghost text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">{group.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-background text-foreground-muted hover:text-foreground transition-colors" title="Edit">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Members */}
      <div className="flex flex-wrap gap-2 mb-2">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border group">
            <div className="w-7 h-7 rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden">
              {m.wrestlers?.photo_url ? (
                <Image src={m.wrestlers.photo_url} alt={m.wrestlers.name} width={28} height={28} className="object-cover w-full h-full" />
              ) : (
                <User className="w-4 h-4 text-foreground-muted" />
              )}
            </div>
            <Link href={`/wrestlers/${m.wrestlers?.slug}`} className="text-sm font-medium hover:text-accent transition-colors">{m.wrestlers?.name}</Link>
            <button onClick={() => handleRemoveMember(m.id)}
              className="p-0.5 rounded text-foreground-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-foreground-muted hover:text-accent hover:border-accent transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Member
        </button>
      </div>

      {/* Add member search */}
      {showAddMember && (
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search wrestlers..." autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
            </div>
            <button onClick={() => { setShowAddMember(false); setSearchQuery(''); setSearchResults([]) }} className="p-2 rounded hover:bg-background-tertiary">
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((w: any) => (
                <button key={w.id} onClick={() => handleAddMember(w)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-tertiary transition-colors text-left text-sm">
                  {w.photo_url ? <Image src={w.photo_url} alt={w.name} width={24} height={24} className="w-6 h-6 rounded-md object-cover" /> : <User className="w-5 h-5 text-foreground-muted" />}
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && <p className="text-xs text-foreground-muted text-center py-2">No wrestlers found.</p>}
          {searching && <div className="flex items-center justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-foreground-muted" /></div>}
        </div>
      )}
    </div>
  )
}

// ============================================
// ROSTER SECTION
// ============================================

function RosterSection({ promotionId, roster, onUpdate }: {
  promotionId: string
  roster: RosterMember[]
  onUpdate: (r: RosterMember[]) => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchWrestlers(query)
    const existingIds = roster.map(r => r.wrestler_id)
    setSearchResults(results.filter((w: any) => !existingIds.includes(w.id)))
    setSearching(false)
  }, [roster])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleAdd = async (wrestlerId: string) => {
    try {
      const member = await addToRoster({ promotion_id: promotionId, wrestler_id: wrestlerId })
      onUpdate([...roster, member])
      setSearchQuery(''); setSearchResults([])
    } catch (err: any) {
      console.error('Error adding to roster:', err)
      alert(err?.message || 'Failed to add wrestler to roster.')
    }
  }

  const handleRemove = async (memberId: string) => {
    try { await removeFromRoster(memberId); onUpdate(roster.filter(r => r.id !== memberId)) }
    catch (err) { console.error('Error removing from roster:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Roster</h2>
          <span className="text-sm text-foreground-muted">({roster.length})</span>
        </div>
        <div className="flex gap-2">
          {roster.length > 1 && (
            <button
              onClick={() => {
                const sorted = [...roster].sort((a, b) =>
                  (a.wrestlers?.name || '').localeCompare(b.wrestlers?.name || '')
                )
                onUpdate(sorted)
              }}
              className="btn btn-ghost text-sm"
              title="Sort A-Z"
            >
              <ArrowDownAZ className="w-4 h-4 mr-1.5" /> A–Z
            </button>
          )}
          <button onClick={() => setShowSearch(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Wrestler
          </button>
        </div>
      </div>

      {roster.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {roster.map((member) => (
            <div key={member.id} className="relative flex flex-col items-center p-3 rounded-lg bg-background-tertiary border border-border group">
              <button onClick={() => handleRemove(member.id)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center overflow-hidden mb-2">
                {member.wrestlers?.photo_url ? (
                  <Image src={member.wrestlers.photo_url} alt={member.wrestlers.name} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-7 h-7 text-foreground-muted" />
                )}
              </div>
              <Link href={`/wrestlers/${member.wrestlers?.slug}`} className="text-sm font-medium text-center hover:text-accent transition-colors line-clamp-2">
                {member.wrestlers?.name}
              </Link>
              {member.wrestlers?.hometown && (
                <span className="text-xs text-foreground-muted mt-0.5 text-center line-clamp-1">{member.wrestlers.hometown}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Users className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">No roster members added yet.</p>
        </div>
      )}

      {showSearch && (
        <div className="mt-4 p-3 rounded-lg bg-background-tertiary border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search wrestlers..." autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
            </div>
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }} className="p-2 rounded hover:bg-background">
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((w: any) => (
                <button key={w.id} onClick={() => handleAdd(w.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors text-left text-sm">
                  {w.photo_url ? <Image src={w.photo_url} alt={w.name} width={24} height={24} className="w-6 h-6 rounded-md object-cover" /> : <User className="w-5 h-5 text-foreground-muted" />}
                  <span>{w.name}</span>
                  {w.hometown && <span className="text-xs text-foreground-muted ml-auto">{w.hometown}</span>}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && <p className="text-xs text-foreground-muted text-center py-2">No wrestlers found.</p>}
          {searching && <div className="flex items-center justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-foreground-muted" /></div>}
        </div>
      )}
    </section>
  )
}
