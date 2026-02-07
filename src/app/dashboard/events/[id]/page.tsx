'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getEventForEditing, getEventMatches, getStreamingLinks, getAnnouncedTalent,
  type EventMatch, type StreamingLink, type AnnouncedTalent,
} from '@/lib/promoter'
import { Loader2, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react'
import { formatEventDateFull, formatLocation } from '@/lib/utils'
import {
  TicketsSection, StreamingLinksSection, EventDetailsSection,
  PosterSection, AnnouncedTalentSection, MatchCardSection,
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
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/signin'); return }
    loadEvent()
  }, [user, authLoading, eventId])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const data = await getEventForEditing(eventId)
      if (!data) { router.push('/dashboard'); return }
      if (data.promotions?.claimed_by !== user?.id) {
        // Check if user is a promotion admin
        const { createClient: createBrowserClient } = await import('@/lib/supabase-browser')
        const supabase = createBrowserClient()
        const { data: adminCheck } = await supabase
          .from('promotion_admins')
          .select('id')
          .eq('promotion_id', data.promotions?.id)
          .eq('user_id', user?.id)
          .maybeSingle()
        if (!adminCheck) { setAuthorized(false); setLoading(false); return }
      }
      setEvent(data)
      setAuthorized(true)
      const [eventMatches, links, talent] = await Promise.all([
        getEventMatches(eventId), getStreamingLinks(eventId), getAnnouncedTalent(eventId),
      ])
      setMatches(eventMatches)
      setStreamingLinks(links)
      setAnnouncedTalent(talent)
    } catch (err) { console.error('Error loading event:', err) }
    setLoading(false)
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
            <span>{formatLocation(event.city, event.state)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <TicketsSection event={event} onUpdate={setEvent} />
        <StreamingLinksSection eventId={eventId} links={streamingLinks} onUpdate={setStreamingLinks} />
        <EventDetailsSection event={event} onUpdate={setEvent} />
        <PosterSection event={event} eventId={eventId} onUpdate={setEvent} />
        <AnnouncedTalentSection eventId={eventId} talent={announcedTalent} onUpdate={setAnnouncedTalent} />
        <MatchCardSection eventId={eventId} matches={matches} onUpdate={setMatches} />

        <div className="text-center pt-4">
          <Link href={`/events/${eventId}`} className="btn btn-ghost text-sm">
            <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Event Page
          </Link>
        </div>
      </div>
    </div>
  )
}
