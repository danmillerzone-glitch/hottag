'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  updateEvent, getEventMatches, createMatch, deleteMatch, updateMatch, addMatchParticipant, removeMatchParticipant,
  searchWrestlers, uploadEventPoster, getStreamingLinks, addStreamingLink, deleteStreamingLink,
  getAnnouncedTalent, addAnnouncedTalent, removeAnnouncedTalent, updateAnnouncedTalent,
  type EventMatch, type StreamingLink, type AnnouncedTalent,
} from '@/lib/promoter'
import {
  Loader2, Save, Ticket, Video, FileText, ImageIcon, Plus, Trash2, Search, X,
  ExternalLink, Upload, Check, Trophy, User, Swords, Megaphone, Edit3,
} from 'lucide-react'

// ============================================
// TICKETS SECTION
// ============================================

export function TicketsSection({ event, onUpdate }: { event: any; onUpdate: (e: any) => void }) {
  const [ticketUrl, setTicketUrl] = useState(event.ticket_url || '')
  const [priceMin, setPriceMin] = useState(event.ticket_price_min?.toString() || '')
  const [priceMax, setPriceMax] = useState(event.ticket_price_max?.toString() || '')
  const [isFree, setIsFree] = useState(event.is_free || false)
  const [isSoldOut, setIsSoldOut] = useState(event.is_sold_out || false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const updated = await updateEvent(event.id, { ticket_url: ticketUrl || null, ticket_price_min: priceMin ? parseFloat(priceMin) : null, ticket_price_max: priceMax ? parseFloat(priceMax) : null, is_free: isFree, is_sold_out: isSoldOut })
      onUpdate({ ...event, ...updated }); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error('Error saving:', err) }
    setSaving(false)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Ticket className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Tickets</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Ticket Link</label>
          <input type="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="https://tickets.example.com/your-event"
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Min Price ($)</label>
            <input type="number" step="0.01" min="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="20.00" disabled={isFree}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors disabled:opacity-40" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max Price ($)</label>
            <input type="number" step="0.01" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="40.00" disabled={isFree}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors disabled:opacity-40" />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-accent" />
            <span className="text-sm">Free event</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isSoldOut} onChange={(e) => setIsSoldOut(e.target.checked)} className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-accent" />
            <span className="text-sm">Sold out</span>
          </label>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</> : saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</> : <><Save className="w-4 h-4 mr-1.5" /> Save Tickets</>}
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// STREAMING LINKS SECTION
// ============================================

const PLATFORM_OPTIONS = ['FITE/Triller TV', 'YouTube', 'Twitch', 'IWTV', 'Peacock', 'Title Match Network', 'Highspots Wrestling Network', 'Facebook Live', 'X/Twitter', 'Other']

export function StreamingLinksSection({ eventId, links, onUpdate }: { eventId: string; links: StreamingLink[]; onUpdate: (l: StreamingLink[]) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [platform, setPlatform] = useState('')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [isLive, setIsLive] = useState(true)
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!platform || !url) return
    setAdding(true)
    try {
      const link = await addStreamingLink({ event_id: eventId, platform, url, label: label || undefined, is_live: isLive })
      onUpdate([...links, link]); setPlatform(''); setUrl(''); setLabel(''); setIsLive(true); setShowAdd(false)
    } catch (err) { console.error('Error adding link:', err) }
    setAdding(false)
  }

  const handleDelete = async (linkId: string) => {
    try { await deleteStreamingLink(linkId); onUpdate(links.filter(l => l.id !== linkId)) }
    catch (err) { console.error('Error deleting link:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Streaming / VOD Links</h2>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Link
        </button>
      </div>

      {links.length > 0 ? (
        <div className="space-y-2 mb-4">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border border-border group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{link.platform}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${link.is_live ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {link.is_live ? 'LIVE' : 'VOD'}
                  </span>
                  {link.label && <span className="text-xs text-foreground-muted">· {link.label}</span>}
                </div>
                <div className="text-xs text-foreground-muted truncate mt-0.5">{link.url}</div>
              </div>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-background text-foreground-muted hover:text-accent transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : !showAdd && <p className="text-sm text-foreground-muted mb-4">No streaming links added yet.</p>}

      {showAdd && (
        <div className="p-4 rounded-lg bg-background-tertiary border border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none transition-colors text-sm">
                <option value="">Select platform...</option>
                {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" checked={isLive} onChange={() => setIsLive(true)} className="text-accent focus:ring-accent" /> Live Stream
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" checked={!isLive} onChange={() => setIsLive(false)} className="text-accent focus:ring-accent" /> VOD / Replay
                </label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custom Label <span className="text-foreground-muted">(optional)</span></label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder='e.g., "English Commentary" or "Free Preview"'
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setShowAdd(false); setPlatform(''); setUrl(''); setLabel('') }} className="btn btn-ghost text-sm" disabled={adding}>Cancel</button>
            <button onClick={handleAdd} disabled={adding || !platform || !url} className="btn btn-primary text-sm">
              {adding ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4 mr-1.5" /> Add Link</>}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ============================================
// EVENT DETAILS SECTION
// ============================================

export function EventDetailsSection({ event, onUpdate }: { event: any; onUpdate: (e: any) => void }) {
  const [description, setDescription] = useState(event.description || '')
  const [eventTime, setEventTime] = useState(event.event_time || '')
  const [doorsTime, setDoorsTime] = useState(event.doors_time || '')
  const [venueName, setVenueName] = useState(event.venue_name || '')
  const [venueAddress, setVenueAddress] = useState(event.venue_address || '')
  const [city, setCity] = useState(event.city || '')
  const [state, setState] = useState(event.state || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const updated = await updateEvent(event.id, {
        description: description || null,
        event_time: eventTime || null,
        doors_time: doorsTime || null,
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        city: city || null,
        state: state || null,
      })
      onUpdate({ ...event, ...updated }); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error('Error saving:', err) }
    setSaving(false)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Event Details</h2>
      </div>
      <div className="space-y-4">
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue Name</label>
            <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Venue name..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue Address</label>
            <input type="text" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="123 Main St..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">State</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Event Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event..." rows={5}
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none" />
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</> : saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</> : <><Save className="w-4 h-4 mr-1.5" /> Save Details</>}
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// POSTER SECTION
// ============================================

export function PosterSection({ event, eventId, onUpdate }: { event: any; eventId: string; onUpdate: (e: any) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setUploading(true); setError('')
    try {
      const posterUrl = await uploadEventPoster(eventId, file)
      onUpdate({ ...event, poster_url: posterUrl })
    } catch (err: any) { setError(err?.message || 'Failed to upload poster.') }
    setUploading(false)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <ImageIcon className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Event Poster</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-48 h-64 rounded-lg bg-background-tertiary border border-border overflow-hidden flex-shrink-0">
          {event.poster_url ? (
            <Image src={event.poster_url} alt="Event poster" width={192} height={256} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted">
              <ImageIcon className="w-10 h-10 mb-2" />
              <span className="text-sm">No poster</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
                  <span className="text-sm text-foreground-muted">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-foreground-muted mb-2" />
                  <span className="text-sm font-medium">Click to upload poster</span>
                  <span className="text-xs text-foreground-muted mt-1">PNG, JPG, or WebP · Max 5MB</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
            </div>
          </label>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </section>
  )
}

// ============================================
// ANNOUNCED TALENT SECTION
// ============================================

export function AnnouncedTalentSection({ eventId, talent, onUpdate }: { eventId: string; talent: AnnouncedTalent[]; onUpdate: (t: AnnouncedTalent[]) => void }) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchWrestlers(query)
    const existingIds = talent.map(t => t.wrestler_id)
    setSearchResults(results.filter((w: any) => !existingIds.includes(w.id)))
    setSearching(false)
  }, [talent])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleAdd = async (wrestlerId: string) => {
    try {
      const added = await addAnnouncedTalent({ event_id: eventId, wrestler_id: wrestlerId, sort_order: talent.length })
      onUpdate([...talent, added])
      setSearchQuery(''); setSearchResults([])
    } catch (err: any) {
      if (err?.code !== '23505') console.error('Error adding talent:', err)
    }
  }

  const handleRemove = async (talentId: string) => {
    try { await removeAnnouncedTalent(talentId); onUpdate(talent.filter(t => t.id !== talentId)) }
    catch (err) { console.error('Error removing talent:', err) }
  }

  const handleUpdateNote = async (talentId: string, note: string) => {
    try {
      await updateAnnouncedTalent(talentId, { announcement_note: note || null })
      onUpdate(talent.map(t => t.id === talentId ? { ...t, announcement_note: note || null } : t))
    } catch (err) { console.error('Error updating note:', err) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Announced Talent</h2>
          <span className="text-sm text-foreground-muted">({talent.length})</span>
        </div>
        <button onClick={() => setShowSearch(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Talent
        </button>
      </div>

      <p className="text-xs text-foreground-muted mb-4">
        Add wrestlers who have been announced for this event but don't have specific matches yet.
      </p>

      {talent.length > 0 ? (
        <div className="space-y-2 mb-4">
          {talent.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border border-border group">
              {t.wrestlers?.photo_url ? (
                <Image src={t.wrestlers.photo_url} alt={t.wrestlers?.name || ''} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                  <User className="w-4 h-4 text-foreground-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.wrestlers?.name}</div>
                <input
                  type="text"
                  value={t.announcement_note || ''}
                  onChange={(e) => onUpdate(talent.map(item => item.id === t.id ? { ...item, announcement_note: e.target.value } : item))}
                  onBlur={(e) => handleUpdateNote(t.id, e.target.value)}
                  placeholder="Add note (e.g., Championship Opportunity)"
                  className="text-xs text-foreground-muted bg-transparent outline-none w-full placeholder:text-foreground-muted/30 mt-0.5"
                />
              </div>
              <button onClick={() => handleRemove(t.id)} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : !showSearch && <p className="text-sm text-foreground-muted mb-4">No talent announced yet.</p>}

      {showSearch && (
        <WrestlerSearchBox
          onSelect={handleAdd}
          onClose={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
          excludeIds={talent.map(t => t.wrestler_id)}
        />
      )}
    </section>
  )
}

// ============================================
// MATCH CARD SECTION
// ============================================

export function MatchCardSection({ eventId, matches, onUpdate }: { eventId: string; matches: EventMatch[]; onUpdate: (m: EventMatch[]) => void }) {
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [newMatchTitle, setNewMatchTitle] = useState('')
  const [newMatchType, setNewMatchType] = useState('')
  const [newStipulation, setNewStipulation] = useState('')
  const [isTitleMatch, setIsTitleMatch] = useState(false)
  const [championshipName, setChampionshipName] = useState('')
  const [addingMatch, setAddingMatch] = useState(false)

  const handleAddMatch = async () => {
    setAddingMatch(true)
    try {
      await createMatch({ event_id: eventId, match_title: newMatchTitle || undefined, match_type: newMatchType || undefined, match_stipulation: newStipulation || undefined, match_order: matches.length + 1, is_title_match: isTitleMatch, championship_name: isTitleMatch ? championshipName || undefined : undefined })
      const updated = await getEventMatches(eventId)
      onUpdate(updated)
      setNewMatchTitle(''); setNewMatchType(''); setNewStipulation(''); setIsTitleMatch(false); setChampionshipName('')
      setShowAddMatch(false)
    } catch (err) { console.error('Error adding match:', err) }
    setAddingMatch(false)
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return
    try { await deleteMatch(matchId); onUpdate(matches.filter(m => m.id !== matchId)) }
    catch (err) { console.error('Error deleting match:', err) }
  }

  const handleReloadMatches = async () => {
    const updated = await getEventMatches(eventId)
    onUpdate(updated)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Match Card</h2>
          <span className="text-sm text-foreground-muted">({matches.length} matches)</span>
        </div>
        <button onClick={() => setShowAddMatch(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Match
        </button>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchItem key={match.id} match={match} index={index} onDelete={() => handleDeleteMatch(match.id)} onReload={handleReloadMatches} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Swords className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">No matches added yet.</p>
          <p className="text-sm text-foreground-muted/70 mt-1">Use &quot;Announced Talent&quot; above for events without confirmed matches.</p>
        </div>
      )}

      {showAddMatch && (
        <div className="mt-6 p-5 rounded-lg bg-background-tertiary border border-border">
          <h3 className="font-semibold mb-4">New Match</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Match Title</label>
              <input type="text" value={newMatchTitle} onChange={(e) => setNewMatchTitle(e.target.value)} placeholder='e.g., "Main Event" or "GCW World Championship"'
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Match Type</label>
                <select value={newMatchType} onChange={(e) => setNewMatchType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-accent outline-none transition-colors text-sm">
                  <option value="">Select type...</option>
                  <option value="Singles">Singles</option>
                  <option value="Tag Team">Tag Team</option>
                  <option value="Triple Threat">Triple Threat</option>
                  <option value="Fatal 4-Way">Fatal 4-Way</option>
                  <option value="Battle Royal">Battle Royal</option>
                  <option value="Scramble">Scramble</option>
                  <option value="6-Man Tag">6-Man Tag</option>
                  <option value="8-Man Tag">8-Man Tag</option>
                  <option value="Handicap">Handicap</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stipulation</label>
                <input type="text" value={newStipulation} onChange={(e) => setNewStipulation(e.target.value)} placeholder="No DQ, Cage, Deathmatch..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isTitleMatch} onChange={(e) => setIsTitleMatch(e.target.checked)} className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent" />
                <span className="text-sm">Title match</span>
              </label>
              {isTitleMatch && (
                <input type="text" value={championshipName} onChange={(e) => setChampionshipName(e.target.value)} placeholder="Championship name"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddMatch(false)} className="btn btn-ghost text-sm" disabled={addingMatch}>Cancel</button>
              <button onClick={handleAddMatch} className="btn btn-primary text-sm" disabled={addingMatch}>
                {addingMatch ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4 mr-1.5" /> Add Match</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ============================================
// MATCH ITEM
// ============================================

function MatchItem({ match, index, onDelete, onReload }: { match: EventMatch; index: number; onDelete: () => void; onReload: () => void }) {
  const [showAddWrestler, setShowAddWrestler] = useState(false)
  const [teamNumber, setTeamNumber] = useState(1)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(match.match_title || '')
  const [editType, setEditType] = useState(match.match_type || '')
  const [editStipulation, setEditStipulation] = useState(match.match_stipulation || '')
  const [editTitleMatch, setEditTitleMatch] = useState(match.is_title_match || false)
  const [editChampName, setEditChampName] = useState(match.championship_name || '')
  const [saving, setSaving] = useState(false)
  const participants = match.match_participants || []

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await updateMatch(match.id, {
        match_title: editTitle || null,
        match_type: editType || null,
        match_stipulation: editStipulation || null,
        is_title_match: editTitleMatch,
        championship_name: editTitleMatch ? editChampName || null : null,
      } as any)
      onReload()
      setEditing(false)
    } catch (err) { console.error('Error updating match:', err) }
    setSaving(false)
  }

  const handleAddWrestler = async (wrestlerId: string) => {
    try {
      await addMatchParticipant({ match_id: match.id, wrestler_id: wrestlerId, team_number: teamNumber })
      onReload()
    } catch (err) { console.error('Error adding wrestler:', err) }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try { await removeMatchParticipant(participantId); onReload() }
    catch (err) { console.error('Error removing participant:', err) }
  }

  const team1 = participants.filter(p => p.team_number === 1)
  const team2 = participants.filter(p => p.team_number === 2)
  const hasTeams = team2.length > 0

  const renderParticipant = (p: any) => (
    <div key={p.id} className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border text-sm group">
      {p.wrestlers?.photo_url ? (
        <Image src={p.wrestlers.photo_url} alt={p.wrestlers?.name || ''} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
      ) : (
        <User className="w-4 h-4 text-foreground-muted" />
      )}
      <span>{p.wrestlers?.name}</span>
      <button onClick={() => handleRemoveParticipant(p.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-all">
        <X className="w-3 h-3" />
      </button>
    </div>
  )

  return (
    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground-muted bg-background px-2 py-1 rounded">#{index + 1}</span>
          {editing ? (
            <div className="space-y-2 flex-1">
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Match title..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-accent outline-none" />
              <div className="flex gap-2">
                <select value={editType} onChange={(e) => setEditType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-accent outline-none">
                  <option value="">Type...</option>
                  <option value="Singles">Singles</option>
                  <option value="Tag Team">Tag Team</option>
                  <option value="Triple Threat">Triple Threat</option>
                  <option value="Fatal 4-Way">Fatal 4-Way</option>
                  <option value="Battle Royal">Battle Royal</option>
                  <option value="Scramble">Scramble</option>
                  <option value="6-Man Tag">6-Man Tag</option>
                  <option value="8-Man Tag">8-Man Tag</option>
                  <option value="Handicap">Handicap</option>
                  <option value="Other">Other</option>
                </select>
                <input type="text" value={editStipulation} onChange={(e) => setEditStipulation(e.target.value)} placeholder="Stipulation..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-accent outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editTitleMatch} onChange={(e) => setEditTitleMatch(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-xs">Title match</span>
                </label>
                {editTitleMatch && (
                  <input type="text" value={editChampName} onChange={(e) => setEditChampName(e.target.value)} placeholder="Championship name"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-accent outline-none" />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary text-xs">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Save</>}
                </button>
                <button onClick={() => setEditing(false)} className="btn btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-sm">{match.match_title || `Match ${index + 1}`}</div>
              <div className="text-xs text-foreground-muted flex items-center gap-2">
                {match.match_type && <span>{match.match_type}</span>}
                {match.match_stipulation && <><span>·</span><span>{match.match_stipulation}</span></>}
                {match.is_title_match && (
                  <><span>·</span><span className="text-interested flex items-center gap-0.5"><Trophy className="w-3 h-3" />{match.championship_name || 'Title Match'}</span></>
                )}
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-background text-foreground-muted hover:text-foreground transition-colors" title="Edit match">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors" title="Delete match">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(hasTeams ? team1 : participants).map(renderParticipant)}
        </div>
        {hasTeams && (
          <>
            <div className="text-center text-xs font-bold text-accent">VS</div>
            <div className="flex flex-wrap gap-2">{team2.map(renderParticipant)}</div>
          </>
        )}
      </div>

      {showAddWrestler ? (
        <div className="mt-3">
          {(match.match_type === 'Tag Team' || match.match_type === '6-Man Tag' || match.match_type === '8-Man Tag') && (
            <div className="mb-2">
              <select value={teamNumber} onChange={(e) => setTeamNumber(parseInt(e.target.value))}
                className="px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none">
                <option value={1}>Team 1</option>
                <option value={2}>Team 2</option>
              </select>
            </div>
          )}
          <WrestlerSearchBox
            onSelect={handleAddWrestler}
            onClose={() => setShowAddWrestler(false)}
            excludeIds={participants.map(p => p.wrestler_id)}
          />
        </div>
      ) : (
        <button onClick={() => setShowAddWrestler(true)} className="mt-3 text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add wrestler
        </button>
      )}
    </div>
  )
}

// ============================================
// SHARED WRESTLER SEARCH BOX
// ============================================

function WrestlerSearchBox({ onSelect, onClose, excludeIds }: { onSelect: (id: string) => void; onClose: () => void; excludeIds: string[] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const data = await searchWrestlers(q)
    setResults(data.filter((w: any) => !excludeIds.includes(w.id)))
    setSearching(false)
  }, [excludeIds])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  return (
    <div className="p-3 rounded-lg bg-background-tertiary border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search wrestlers..." autoFocus
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm" />
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-background">
          <X className="w-4 h-4 text-foreground-muted" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {results.map((wrestler: any) => (
            <button key={wrestler.id} onClick={() => { onSelect(wrestler.id); setQuery(''); setResults([]) }}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors text-left text-sm">
              {wrestler.photo_url ? (
                <Image src={wrestler.photo_url} alt={wrestler.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-foreground-muted" />
              )}
              <span>{wrestler.name}</span>
              {wrestler.hometown && <span className="text-xs text-foreground-muted ml-auto">{wrestler.hometown}</span>}
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && !searching && (
        <p className="text-xs text-foreground-muted text-center py-2">No wrestlers found.</p>
      )}
      {searching && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
        </div>
      )}
    </div>
  )
}
