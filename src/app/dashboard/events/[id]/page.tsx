'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getEventForEditing,
  updateEvent,
  getEventMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  addMatchParticipant,
  removeMatchParticipant,
  searchWrestlers,
  uploadEventPoster,
  type EventMatch,
} from '@/lib/promoter'
import {
  Loader2,
  ArrowLeft,
  Save,
  Ticket,
  Video,
  DollarSign,
  Clock,
  FileText,
  ImageIcon,
  Users,
  Plus,
  Trash2,
  Search,
  X,
  ExternalLink,
  Upload,
  Check,
  AlertCircle,
  GripVertical,
  Trophy,
  User,
  Swords,
} from 'lucide-react'
import { formatEventDateFull, formatEventTime, formatLocation } from '@/lib/utils'

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ManageEventPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [matches, setMatches] = useState<EventMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/signin')
      return
    }
    loadEvent()
  }, [user, authLoading, eventId])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const data = await getEventForEditing(eventId)
      if (!data) {
        router.push('/dashboard')
        return
      }

      // Check authorization
      if (data.promotions?.claimed_by !== user?.id) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      setEvent(data)
      setAuthorized(true)

      // Load matches
      const eventMatches = await getEventMatches(eventId)
      setMatches(eventMatches)
    } catch (err) {
      console.error('Error loading event:', err)
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

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Not Authorized</h1>
          <p className="text-foreground-muted mb-4">You don't have permission to manage this event.</p>
          <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-display font-bold">{event.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-foreground-muted">
            <span>{formatEventDateFull(event.event_date)}</span>
            <span>·</span>
            <span>{formatLocation(event.city, event.state)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tickets & Streaming Section */}
        <TicketsStreamingSection event={event} onUpdate={setEvent} />

        {/* Event Details Section */}
        <EventDetailsSection event={event} onUpdate={setEvent} />

        {/* Poster Section */}
        <PosterSection event={event} eventId={eventId} onUpdate={setEvent} />

        {/* Match Card Section */}
        <MatchCardSection eventId={eventId} matches={matches} onUpdate={setMatches} />

        {/* View public page */}
        <div className="text-center pt-4">
          <Link
            href={`/events/${eventId}`}
            className="btn btn-ghost text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View Public Event Page
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TICKETS & STREAMING SECTION
// ============================================

function TicketsStreamingSection({ event, onUpdate }: { event: any; onUpdate: (e: any) => void }) {
  const [ticketUrl, setTicketUrl] = useState(event.ticket_url || '')
  const [streamingUrl, setStreamingUrl] = useState(event.streaming_url || '')
  const [priceMin, setPriceMin] = useState(event.ticket_price_min?.toString() || '')
  const [priceMax, setPriceMax] = useState(event.ticket_price_max?.toString() || '')
  const [isFree, setIsFree] = useState(event.is_free || false)
  const [isSoldOut, setIsSoldOut] = useState(event.is_sold_out || false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateEvent(event.id, {
        ticket_url: ticketUrl || null,
        streaming_url: streamingUrl || null,
        ticket_price_min: priceMin ? parseFloat(priceMin) : null,
        ticket_price_max: priceMax ? parseFloat(priceMax) : null,
        is_free: isFree,
        is_sold_out: isSoldOut,
      })
      onUpdate({ ...event, ...updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving:', err)
    }
    setSaving(false)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Ticket className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Tickets & Streaming</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Ticket Link</label>
          <input
            type="url"
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            placeholder="https://tickets.example.com/your-event"
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Streaming / VOD Link</label>
          <input
            type="url"
            value={streamingUrl}
            onChange={(e) => setStreamingUrl(e.target.value)}
            placeholder="https://fite.tv/your-event or YouTube/Twitch URL"
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
          <p className="text-xs text-foreground-muted mt-1">FITE, YouTube, Triller TV, Twitch, etc.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Min Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="20.00"
              disabled={isFree}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors disabled:opacity-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="40.00"
              disabled={isFree}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors disabled:opacity-40"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-accent"
            />
            <span className="text-sm">Free event</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSoldOut}
              onChange={(e) => setIsSoldOut(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-accent"
            />
            <span className="text-sm">Sold out</span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Save Tickets & Streaming</>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// EVENT DETAILS SECTION
// ============================================

function EventDetailsSection({ event, onUpdate }: { event: any; onUpdate: (e: any) => void }) {
  const [description, setDescription] = useState(event.description || '')
  const [eventTime, setEventTime] = useState(event.event_time || '')
  const [doorsTime, setDoorsTime] = useState(event.doors_time || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateEvent(event.id, {
        description: description || null,
        event_time: eventTime || null,
        doors_time: doorsTime || null,
      })
      onUpdate({ ...event, ...updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving:', err)
    }
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
            <input
              type="time"
              value={doorsTime}
              onChange={(e) => setDoorsTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bell Time</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Event Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event..."
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Save Details</>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// POSTER SECTION
// ============================================

function PosterSection({ event, eventId, onUpdate }: { event: any; eventId: string; onUpdate: (e: any) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const posterUrl = await uploadEventPoster(eventId, file)
      onUpdate({ ...event, poster_url: posterUrl })
    } catch (err: any) {
      setError(err?.message || 'Failed to upload poster.')
    }
    setUploading(false)
  }

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <ImageIcon className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display font-bold">Event Poster</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Current poster preview */}
        <div className="w-48 h-64 rounded-lg bg-background-tertiary border border-border overflow-hidden flex-shrink-0">
          {event.poster_url ? (
            <Image
              src={event.poster_url}
              alt="Event poster"
              width={192}
              height={256}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted">
              <ImageIcon className="w-10 h-10 mb-2" />
              <span className="text-sm">No poster</span>
            </div>
          )}
        </div>

        {/* Upload area */}
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
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </label>
          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
    </section>
  )
}

// ============================================
// MATCH CARD SECTION
// ============================================

function MatchCardSection({ eventId, matches, onUpdate }: {
  eventId: string
  matches: EventMatch[]
  onUpdate: (m: EventMatch[]) => void
}) {
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
      const match = await createMatch({
        event_id: eventId,
        match_title: newMatchTitle || undefined,
        match_type: newMatchType || undefined,
        match_stipulation: newStipulation || undefined,
        match_order: matches.length + 1,
        is_title_match: isTitleMatch,
        championship_name: isTitleMatch ? championshipName || undefined : undefined,
      })
      // Reload matches to get participants
      const updated = await getEventMatches(eventId)
      onUpdate(updated)
      // Reset form
      setNewMatchTitle('')
      setNewMatchType('')
      setNewStipulation('')
      setIsTitleMatch(false)
      setChampionshipName('')
      setShowAddMatch(false)
    } catch (err) {
      console.error('Error adding match:', err)
    }
    setAddingMatch(false)
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return
    try {
      await deleteMatch(matchId)
      onUpdate(matches.filter(m => m.id !== matchId))
    } catch (err) {
      console.error('Error deleting match:', err)
    }
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
        <button
          onClick={() => setShowAddMatch(true)}
          className="btn btn-primary text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Match
        </button>
      </div>

      {/* Existing matches */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchItem
              key={match.id}
              match={match}
              index={index}
              onDelete={() => handleDeleteMatch(match.id)}
              onReload={handleReloadMatches}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Swords className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-muted">No matches added yet.</p>
          <p className="text-sm text-foreground-muted/70 mt-1">Add matches to build your event card.</p>
        </div>
      )}

      {/* Add Match Form */}
      {showAddMatch && (
        <div className="mt-6 p-5 rounded-lg bg-background-tertiary border border-border">
          <h3 className="font-semibold mb-4">New Match</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Match Title</label>
              <input
                type="text"
                value={newMatchTitle}
                onChange={(e) => setNewMatchTitle(e.target.value)}
                placeholder='e.g., "Main Event" or "GCW World Championship"'
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Match Type</label>
                <select
                  value={newMatchType}
                  onChange={(e) => setNewMatchType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                >
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
                <input
                  type="text"
                  value={newStipulation}
                  onChange={(e) => setNewStipulation(e.target.value)}
                  placeholder="No DQ, Cage, Deathmatch..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTitleMatch}
                  onChange={(e) => setIsTitleMatch(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent"
                />
                <span className="text-sm">Title match</span>
              </label>
              {isTitleMatch && (
                <input
                  type="text"
                  value={championshipName}
                  onChange={(e) => setChampionshipName(e.target.value)}
                  placeholder="Championship name"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddMatch(false)}
                className="btn btn-ghost text-sm"
                disabled={addingMatch}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMatch}
                className="btn btn-primary text-sm"
                disabled={addingMatch}
              >
                {addingMatch ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1.5" /> Add Match</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ============================================
// INDIVIDUAL MATCH ITEM
// ============================================

function MatchItem({ match, index, onDelete, onReload }: {
  match: EventMatch
  index: number
  onDelete: () => void
  onReload: () => void
}) {
  const [showAddWrestler, setShowAddWrestler] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [teamNumber, setTeamNumber] = useState(1)

  const participants = match.match_participants || []

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const results = await searchWrestlers(query)
    // Filter out already-added wrestlers
    const existingIds = participants.map(p => p.wrestler_id)
    setSearchResults(results.filter((w: any) => !existingIds.includes(w.id)))
    setSearching(false)
  }, [participants])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const handleAddWrestler = async (wrestlerId: string) => {
    try {
      await addMatchParticipant({
        match_id: match.id,
        wrestler_id: wrestlerId,
        team_number: teamNumber,
      })
      onReload()
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      console.error('Error adding wrestler:', err)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeMatchParticipant(participantId)
      onReload()
    } catch (err) {
      console.error('Error removing participant:', err)
    }
  }

  const team1 = participants.filter(p => p.team_number === 1)
  const team2 = participants.filter(p => p.team_number === 2)
  const hasTeams = team2.length > 0

  return (
    <div className="p-4 rounded-lg bg-background-tertiary border border-border">
      {/* Match header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground-muted bg-background px-2 py-1 rounded">
            #{index + 1}
          </span>
          <div>
            <div className="font-semibold text-sm">
              {match.match_title || `Match ${index + 1}`}
            </div>
            <div className="text-xs text-foreground-muted flex items-center gap-2">
              {match.match_type && <span>{match.match_type}</span>}
              {match.match_stipulation && (
                <>
                  <span>·</span>
                  <span>{match.match_stipulation}</span>
                </>
              )}
              {match.is_title_match && (
                <>
                  <span>·</span>
                  <span className="text-interested flex items-center gap-0.5">
                    <Trophy className="w-3 h-3" />
                    {match.championship_name || 'Title Match'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-colors"
          title="Delete match"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        {/* Team 1 / All participants */}
        <div className="flex flex-wrap gap-2">
          {(hasTeams ? team1 : participants).map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border text-sm group"
            >
              {p.wrestlers?.photo_url ? (
                <Image
                  src={p.wrestlers.photo_url}
                  alt={p.wrestlers?.name || ''}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-foreground-muted" />
              )}
              <span>{p.wrestlers?.name}</span>
              <button
                onClick={() => handleRemoveParticipant(p.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* VS divider for team matches */}
        {hasTeams && (
          <>
            <div className="text-center text-xs font-bold text-accent">VS</div>
            <div className="flex flex-wrap gap-2">
              {team2.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border text-sm group"
                >
                  {p.wrestlers?.photo_url ? (
                    <Image
                      src={p.wrestlers.photo_url}
                      alt={p.wrestlers?.name || ''}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-foreground-muted" />
                  )}
                  <span>{p.wrestlers?.name}</span>
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Wrestler */}
      {showAddWrestler ? (
        <div className="mt-3 p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wrestlers..."
                autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
              />
            </div>
            {(match.match_type === 'Tag Team' || match.match_type === '6-Man Tag' || match.match_type === '8-Man Tag') && (
              <select
                value={teamNumber}
                onChange={(e) => setTeamNumber(parseInt(e.target.value))}
                className="px-2 py-2 rounded-lg bg-background-tertiary border border-border text-sm text-foreground outline-none"
              >
                <option value={1}>Team 1</option>
                <option value={2}>Team 2</option>
              </select>
            )}
            <button
              onClick={() => { setShowAddWrestler(false); setSearchQuery(''); setSearchResults([]) }}
              className="p-2 rounded hover:bg-background-tertiary"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map((wrestler: any) => (
                <button
                  key={wrestler.id}
                  onClick={() => handleAddWrestler(wrestler.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-tertiary transition-colors text-left text-sm"
                >
                  {wrestler.photo_url ? (
                    <Image
                      src={wrestler.photo_url}
                      alt={wrestler.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-foreground-muted" />
                  )}
                  <span>{wrestler.name}</span>
                  {wrestler.hometown && (
                    <span className="text-xs text-foreground-muted ml-auto">{wrestler.hometown}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <p className="text-xs text-foreground-muted text-center py-2">No wrestlers found.</p>
          )}
          {searching && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAddWrestler(true)}
          className="mt-3 text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add wrestler
        </button>
      )}
    </div>
  )
}
