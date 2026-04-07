'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getEventForEditing, getEventMatches, getStreamingLinks, getAnnouncedTalent,
  getRosterForEventPromotions,
  type EventMatch, type StreamingLink, type AnnouncedTalent, type RosterWrestler,
} from '@/lib/promoter'
import { Loader2, ArrowLeft, ExternalLink, AlertCircle, X } from 'lucide-react'
import { formatEventDateFull, formatLocation } from '@/lib/utils'
import {
  TicketsSection, StreamingLinksSection, EventDetailsSection,
  VenueInfoSection, EventTagsSection,
  PosterSection, AnnouncedTalentSection, AnnouncedCrewSection, MatchCardSection, LinkedWrestlersSection,
} from '@/components/DashboardEventSections'

export default function ManageEventPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<any>(null)
  const [matches, setMatches] = useState<EventMatch[]>([])
  const [streamingLinks, setStreamingLinks] = useState<StreamingLink[]>([])
  const [announcedTalent, setAnnouncedTalent] = useState<AnnouncedTalent[]>([])
  const [rosterWrestlers, setRosterWrestlers] = useState<RosterWrestler[]>([])
  const [coPromotions, setCoPromotions] = useState<any[]>([])
  const [promoSearch, setPromoSearch] = useState('')
  const [promoResults, setPromoResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const loadedRef = React.useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/signin'); return }
    if (!loadedRef.current) {
      loadedRef.current = true
      loadEvent()
    }
  }, [user, authLoading, eventId])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const data = await getEventForEditing(eventId)
      if (!data) { router.push('/dashboard'); return }

      // Check if user is a co-promoter (via junction table)
      const isCoPromoter = data.event_promotions?.some(
        (ep: any) => ep.promotions?.claimed_by === user?.id
      )

      if (!isCoPromoter) {
        // Check if user is a promotion admin for any of the co-promoters
        const { createClient: createBrowserClient } = await import('@/lib/supabase-browser')
        const supabase = createBrowserClient()

        const promotionIds = data.event_promotions?.map((ep: any) => ep.promotion_id) || []
        let hasAdminAccess = false

        if (promotionIds.length > 0) {
          const { data: adminCheck } = await supabase
            .from('promotion_admins')
            .select('id')
            .in('promotion_id', promotionIds)
            .eq('user_id', user?.id)
            .maybeSingle()
          if (adminCheck) hasAdminAccess = true
        }

        if (!hasAdminAccess) { setAuthorized(false); setLoading(false); return }
      }

      setEvent(data)
      setCoPromotions(data.event_promotions || [])
      setAuthorized(true)
      const [eventMatches, links, talent, roster] = await Promise.all([
        getEventMatches(eventId),
        getStreamingLinks(eventId),
        getAnnouncedTalent(eventId),
        getRosterForEventPromotions(eventId),
      ])
      setMatches(eventMatches)
      setStreamingLinks(links)
      setAnnouncedTalent(talent)
      setRosterWrestlers(roster)
    } catch (err) { console.error('Error loading event:', err) }
    setLoading(false)
  }

  const searchPromotions = async (query: string) => {
    if (query.length < 2) { setPromoResults([]); return }
    const { createClient } = await import('@/lib/supabase-browser')
    const supabase = createClient()
    const { data } = await supabase
      .from('promotions')
      .select('id, name, slug, logo_url')
      .ilike('name', `%${query}%`)
      .limit(5)
    // Filter out already-linked promotions
    const existingIds = new Set(coPromotions.map(ep => ep.promotion_id))
    setPromoResults((data || []).filter(p => !existingIds.has(p.id)))
  }

  const addCoPromoter = async (promotionId: string) => {
    const { createClient } = await import('@/lib/supabase-browser')
    const supabase = createClient()
    const { error } = await supabase
      .from('event_promotions')
      .insert({ event_id: eventId, promotion_id: promotionId })
    if (!error) {
      await loadEvent() // Refresh
      setPromoSearch('')
      setPromoResults([])
    }
  }

  const removeCoPromoter = async (promotionId: string) => {
    if (coPromotions.length <= 1) return // Can't remove the last one
    const { createClient } = await import('@/lib/supabase-browser')
    const supabase = createClient()
    await supabase
      .from('event_promotions')
      .delete()
      .eq('event_id', eventId)
      .eq('promotion_id', promotionId)
    await loadEvent()
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Not Authorized</h1>
          <p className="text-foreground-muted mb-4">You don&apos;t have permission to manage this event.</p>
          <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="min-h-screen">
      <div className="bg-background-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-display font-bold">{event.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-foreground-muted">
            <span>{formatEventDateFull(event.event_date)}</span>
            <span>·</span>
            <span>{formatLocation(event.city, event.state, event.country)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <TicketsSection event={event} onUpdate={setEvent} />
        <StreamingLinksSection eventId={eventId} links={streamingLinks} onUpdate={setStreamingLinks} />
        <EventDetailsSection event={event} onUpdate={setEvent} />
        <VenueInfoSection event={event} onUpdate={setEvent} />

        {/* Co-Promoters */}
        <div className="bg-background-secondary rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold mb-4">Co-Promoters</h2>
          <p className="text-sm text-foreground-muted mb-4">
            Add other promotions co-hosting this event. All co-promoters get equal dashboard access.
          </p>

          {/* Current co-promoters as chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {coPromotions.map((ep: any) => (
              <div key={ep.promotion_id} className="flex items-center gap-2 bg-background-tertiary rounded-lg px-3 py-2">
                {ep.promotions?.logo_url && (
                  <Image src={ep.promotions.logo_url} alt="" width={20} height={20} className="rounded-sm object-contain" />
                )}
                <span className="text-sm font-medium">{ep.promotions?.name}</span>
                {coPromotions.length > 1 && (
                  <button onClick={() => removeCoPromoter(ep.promotion_id)} className="text-foreground-muted hover:text-red-400 ml-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Search to add */}
          <div className="relative">
            <input
              type="text"
              value={promoSearch}
              onChange={(e) => { setPromoSearch(e.target.value); searchPromotions(e.target.value) }}
              placeholder="Search promotions to add..."
              className="input-field w-full"
            />
            {promoResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-background-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {promoResults.map(p => (
                  <button key={p.id} onClick={() => addCoPromoter(p.id)}
                    className="w-full text-left px-4 py-2 hover:bg-background-tertiary flex items-center gap-2">
                    {p.logo_url && <Image src={p.logo_url} alt="" width={20} height={20} className="rounded-sm object-contain" />}
                    <span className="text-sm">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <EventTagsSection event={event} onUpdate={setEvent} />
        <PosterSection event={event} eventId={eventId} onUpdate={setEvent} />
        <AnnouncedTalentSection
          eventId={eventId}
          talent={announcedTalent}
          rosterWrestlers={rosterWrestlers}
          onUpdate={setAnnouncedTalent}
        />
        <AnnouncedCrewSection eventId={eventId} />
        <MatchCardSection
          eventId={eventId}
          matches={matches}
          rosterWrestlers={rosterWrestlers}
          onUpdate={setMatches}
        />
        <LinkedWrestlersSection eventId={eventId} />

        <div className="text-center pt-4">
          <Link href={`/events/${eventId}`} className="btn btn-ghost text-sm">
            <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Event Page
          </Link>
        </div>
      </div>
    </div>
  )
}
