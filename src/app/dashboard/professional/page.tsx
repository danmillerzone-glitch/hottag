'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getProfessionalDashboard, updateProfessional,
  searchUpcomingEvents, getCrewSelfAnnouncements, getCrewAnnouncedEventIds,
  crewSelfAnnounceAtEvent, removeCrewSelfAnnouncement,
} from '@/lib/professional'
import { createClient } from '@/lib/supabase-browser'
import { PROFESSIONAL_ROLES, ROLE_LABELS, formatRoles } from '@/lib/supabase'
import ImageCropUploader from '@/components/ImageCropUploader'
import VideoManager from '@/components/VideoManager'
import MerchManager from '@/components/MerchManager'
import PortfolioManager from '@/components/PortfolioManager'
import {
  Loader2, ArrowLeft, Save, User, Globe, Instagram, Youtube, Upload, Check,
  ExternalLink, Mail, Briefcase, Megaphone, Search, X, Plus,
} from 'lucide-react'

// X icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function ProfessionalDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [professional, setProfessional] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dataLoaded = useRef(false)

  // Form state
  const [name, setName] = useState('')
  const [roles, setRoles] = useState<string[]>(['other'])
  const [moniker, setMoniker] = useState('')
  const [bio, setBio] = useState('')
  const [hometown, setHometown] = useState('')
  const [residence, setResidence] = useState('')
  const [website, setWebsite] = useState('')
  const [bookingEmail, setBookingEmail] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [tiktokHandle, setTiktokHandle] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [blueskyHandle, setBlueskyHandle] = useState('')
  const [patreonUrl, setPatreonUrl] = useState('')
  const [videoSectionTitle, setVideoSectionTitle] = useState('')

  // Self-announcement state
  const [selfAnnouncements, setSelfAnnouncements] = useState<any[]>([])
  const [announcedEventIds, setAnnouncedEventIds] = useState<string[]>([])
  const [showEventSearch, setShowEventSearch] = useState(false)
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [eventSearchResults, setEventSearchResults] = useState<any[]>([])
  const [searchingEvents, setSearchingEvents] = useState(false)
  const [addingSelfAnnounce, setAddingSelfAnnounce] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/signin'); return }
    if (!dataLoaded.current) loadDashboard()
  }, [user, authLoading])

  async function loadDashboard() {
    const data = await getProfessionalDashboard()
    if (!data) { router.push('/dashboard'); return }
    const p = data.professional
    setProfessional(p)
    setName(p.name || '')
    setRoles(Array.isArray(p.role) ? p.role : [p.role || 'other'])
    setMoniker(p.moniker || '')
    setBio(p.bio || '')
    setHometown(p.hometown || '')
    setResidence(p.residence || '')
    setWebsite(p.website || '')
    setBookingEmail(p.booking_email || '')
    setTwitterHandle(p.twitter_handle || '')
    setInstagramHandle(p.instagram_handle || '')
    setTiktokHandle(p.tiktok_handle || '')
    setYoutubeUrl(p.youtube_url || '')
    setBlueskyHandle(p.bluesky_handle || '')
    setPatreonUrl(p.patreon_url || '')
    setVideoSectionTitle(p.video_section_title || '')
    // Load self-announcements
    const [selfAnns, annEventIds] = await Promise.all([
      getCrewSelfAnnouncements(p.id),
      getCrewAnnouncedEventIds(p.id),
    ])
    setSelfAnnouncements(selfAnns)
    setAnnouncedEventIds(annEventIds)
    dataLoaded.current = true
    setLoading(false)
  }

  async function handleSave() {
    if (!professional) return
    setSaving(true); setSaved(false)
    try {
      const updated = await updateProfessional(professional.id, {
        name: name || professional.name,
        role: roles,
        moniker: moniker || null,
        bio: bio || null,
        hometown: hometown || null,
        residence: residence || null,
        website: website || null,
        booking_email: bookingEmail || null,
        twitter_handle: twitterHandle || null,
        instagram_handle: instagramHandle || null,
        tiktok_handle: tiktokHandle || null,
        youtube_url: youtubeUrl || null,
        bluesky_handle: blueskyHandle || null,
        patreon_url: patreonUrl || null,
        video_section_title: videoSectionTitle || null,
      })
      setProfessional(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  // Debounced event search for self-announce
  useEffect(() => {
    if (eventSearchQuery.length < 2) { setEventSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearchingEvents(true)
      const results = await searchUpcomingEvents(eventSearchQuery)
      setEventSearchResults(results.filter((e: any) => !announcedEventIds.includes(e.id)))
      setSearchingEvents(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [eventSearchQuery, announcedEventIds])

  const handleSelfAnnounce = async (eventId: string) => {
    if (!professional) return
    setAddingSelfAnnounce(true)
    try {
      const result = await crewSelfAnnounceAtEvent(professional.id, eventId)
      setSelfAnnouncements(prev => [...prev, result])
      setAnnouncedEventIds(prev => [...prev, eventId])
      setEventSearchQuery('')
      setEventSearchResults([])
      setShowEventSearch(false)
    } catch (err: any) {
      if (err?.code === '23505') {
        alert('You are already announced at this event.')
      } else {
        alert(`Failed to announce: ${err.message}`)
      }
    }
    setAddingSelfAnnounce(false)
  }

  const handleRemoveSelfAnnouncement = async (announcementId: string, eventId: string) => {
    setSelfAnnouncements(prev => prev.filter(a => a.id !== announcementId))
    setAnnouncedEventIds(prev => prev.filter(id => id !== eventId))
    try {
      await removeCrewSelfAnnouncement(announcementId)
    } catch (err: any) {
      alert(`Failed to remove: ${err.message}`)
      if (professional) {
        const [anns, ids] = await Promise.all([
          getCrewSelfAnnouncements(professional.id),
          getCrewAnnouncedEventIds(professional.id),
        ])
        setSelfAnnouncements(anns)
        setAnnouncedEventIds(ids)
      }
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  }

  if (!professional) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-background-secondary"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Edit Profile</h1>
            <p className="text-sm text-foreground-muted">{professional.name} • {formatRoles(professional.role)}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Photo */}
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-background-tertiary border-2 border-border">
                {professional.photo_url ? (
                  <Image src={professional.photo_url} alt={professional.name} width={96} height={96} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-foreground-muted" /></div>
                )}
              </div>
              <ImageCropUploader
                currentUrl={professional.photo_url}
                shape="square"
                size={96}
                onUpload={async (file) => {
                  const supabase = createClient()
                  const fileName = `pro-${professional.id}-${Date.now()}.jpg`
                  const { error } = await supabase.storage.from('wrestler-photos').upload(fileName, file, { upsert: true })
                  if (error) throw error
                  const { data: { publicUrl } } = supabase.storage.from('wrestler-photos').getPublicUrl(fileName)
                  await supabase.from('professionals').update({ photo_url: publicUrl }).eq('id', professional.id)
                  setProfessional({ ...professional, photo_url: publicUrl })
                  return publicUrl
                }}
              />
            </div>
          </section>

          {/* Basic Info */}
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold mb-4">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Roles</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROFESSIONAL_ROLES.map(r => (
                    <label key={r} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      roles.includes(r) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background-tertiary text-foreground-muted hover:text-foreground'
                    }`}>
                      <input type="checkbox" checked={roles.includes(r)} onChange={() => {
                        setRoles(roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r])
                      }} className="hidden" />
                      <span className="text-sm">{ROLE_LABELS[r]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tagline <span className="text-foreground-muted font-normal">(optional)</span></label>
                <input type="text" value={moniker} onChange={e => setMoniker(e.target.value)} placeholder="A short description or catchphrase"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Hometown</label>
                  <input type="text" value={hometown} onChange={e => setHometown(e.target.value)} placeholder="Where you're from"
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Based In</label>
                  <input type="text" value={residence} onChange={e => setResidence(e.target.value)} placeholder="Current location"
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold mb-4">About</h2>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5}
              placeholder="Tell people about yourself and your work..."
              className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none resize-y" />
          </section>

          {/* Announce at Events */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-display font-bold">Announce at Events</h2>
              </div>
              <button
                onClick={() => setShowEventSearch(!showEventSearch)}
                className="btn btn-secondary text-sm"
              >
                <Search className="w-4 h-4 mr-1" />
                Find Event
              </button>
            </div>
            <p className="text-sm text-foreground-muted mb-4">
              Search for upcoming events on Hot Tag and announce that you'll be working there. This adds you to the event's Announced Crew section.
            </p>

            {showEventSearch && (
              <div className="p-4 rounded-lg bg-background-tertiary border border-border mb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                      type="text"
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      placeholder="Search events by name or city..."
                      autoFocus
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none transition-colors text-sm"
                    />
                  </div>
                  <button
                    onClick={() => { setShowEventSearch(false); setEventSearchQuery(''); setEventSearchResults([]) }}
                    className="p-2 rounded hover:bg-background"
                  >
                    <X className="w-4 h-4 text-foreground-muted" />
                  </button>
                </div>
                {eventSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {eventSearchResults.map((event: any) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelfAnnounce(event.id)}
                        disabled={addingSelfAnnounce}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors text-left"
                      >
                        <div className="text-center flex-shrink-0 w-12">
                          <div className="text-xs text-foreground-muted uppercase">
                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-lg font-bold text-accent">
                            {new Date(event.event_date + 'T00:00:00').getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.name}</div>
                          <div className="text-xs text-foreground-muted truncate">
                            {event.promotions?.name}{event.city && ` · ${event.city}`}{event.state && `, ${event.state}`}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-accent flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {eventSearchQuery.length >= 2 && eventSearchResults.length === 0 && !searchingEvents && (
                  <p className="text-xs text-foreground-muted text-center py-2">No upcoming events found.</p>
                )}
                {searchingEvents && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                  </div>
                )}
              </div>
            )}

            {selfAnnouncements.length > 0 ? (
              <div className="space-y-2">
                {selfAnnouncements.map((ann: any) => (
                  <div key={ann.id} className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border border-border group">
                    <div className="text-center flex-shrink-0 w-14">
                      <div className="text-xs text-foreground-muted uppercase">
                        {new Date(ann.events.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {new Date(ann.events.event_date + 'T00:00:00').getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/events/${ann.events.id}`} className="text-sm font-medium hover:text-accent transition-colors truncate block">
                        {ann.events.name}
                      </Link>
                      <div className="text-xs text-foreground-muted truncate">
                        {ann.events.promotions?.name}{ann.events.city && ` · ${ann.events.city}`}{ann.events.state && `, ${ann.events.state}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSelfAnnouncement(ann.id, ann.event_id)}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-foreground-muted text-sm">
                No event announcements yet. Search for events to announce your appearance!
              </div>
            )}
          </section>

          {/* Videos */}
          <VideoManager professionalId={professional.id} sectionTitle={videoSectionTitle} onSectionTitleChange={setVideoSectionTitle} />

          {/* Portfolio */}
          <PortfolioManager professionalId={professional.id} />

          {/* Merch */}
          <MerchManager professionalId={professional.id} />

          {/* Social Links */}
          <section className="card p-6">
            <h2 className="text-lg font-display font-bold mb-4">Links & Socials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Globe className="w-4 h-4" /> Website</label>
                <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Mail className="w-4 h-4" /> Booking Email</label>
                <input type="text" value={bookingEmail} onChange={e => setBookingEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><XIcon className="w-4 h-4" /> X / Twitter</label>
                <input type="text" value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="handle (no @)"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Instagram</label>
                <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} placeholder="handle (no @)"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Youtube className="w-4 h-4" /> YouTube</label>
                <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Bluesky</label>
                <input type="text" value={blueskyHandle} onChange={e => setBlueskyHandle(e.target.value)} placeholder="handle.bsky.social"
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Patreon</label>
                <input type="text" value={patreonUrl} onChange={e => setPatreonUrl(e.target.value)} placeholder="https://patreon.com/..."
                  className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent outline-none" />
              </div>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center justify-between">
            <Link href={`/crew/${professional.slug}`} className="btn btn-ghost text-sm">
              <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Page
            </Link>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</>
                : saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
                : <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
