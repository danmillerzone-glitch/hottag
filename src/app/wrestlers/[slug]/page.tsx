import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { formatEventDateFull } from '@/lib/utils'
import FollowWrestlerButton from '@/components/FollowWrestlerButton'

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WrestlerPageProps {
  params: { slug: string }
}

async function getWrestler(slug: string) {
  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching wrestler:', error)
    return null
  }

  return data
}

async function getWrestlerEvents(wrestlerId: string) {
  const { data, error } = await supabase
    .from('event_wrestlers')
    .select(`
      events (
        id,
        name,
        slug,
        event_date,
        city,
        state,
        promotions (
          name,
          slug
        )
      )
    `)
    .eq('wrestler_id', wrestlerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wrestler events:', error)
    return []
  }

  // Extract events and sort by date
  const events = data
    .map((d: any) => d.events)
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  return events
}

async function getFollowerCount(wrestlerId: string) {
  const { count } = await supabase
    .from('user_follows_wrestler')
    .select('*', { count: 'exact', head: true })
    .eq('wrestler_id', wrestlerId)

  return count || 0
}

export async function generateMetadata({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)
  
  if (!wrestler) {
    return { title: 'Wrestler Not Found | HotTag' }
  }

  return {
    title: `${wrestler.name} | HotTag`,
    description: `Follow ${wrestler.name} on HotTag to see their upcoming events.`,
  }
}

export default async function WrestlerPage({ params }: WrestlerPageProps) {
  const wrestler = await getWrestler(params.slug)

  if (!wrestler) {
    notFound()
  }

  const events = await getWrestlerEvents(wrestler.id)
  const followerCount = await getFollowerCount(wrestler.id)
  
  // Split events into upcoming and past
  const now = new Date()
  const upcomingEvents = events.filter((e: any) => new Date(e.event_date) >= now)
  const pastEvents = events.filter((e: any) => new Date(e.event_date) < now)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Photo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
              {wrestler.photo_url ? (
                <Image
                  src={wrestler.photo_url}
                  alt={wrestler.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-16 h-16 text-foreground-muted" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {wrestler.name}
              </h1>
              
              {wrestler.hometown && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-foreground-muted mb-4">
                  <MapPin className="w-4 h-4" />
                  {wrestler.hometown}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <FollowWrestlerButton 
                  wrestlerId={wrestler.id}
                  wrestlerName={wrestler.name}
                  initialFollowerCount={followerCount}
                />
                
                {wrestler.twitter_handle && (
                  <a
                    href={`https://x.com/${wrestler.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    @{wrestler.twitter_handle}
                  </a>
                )}
              </div>

              {wrestler.bio && (
                <p className="text-foreground-muted max-w-2xl">
                  {wrestler.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold mb-6">
              Upcoming Events ({upcomingEvents.length})
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-accent font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(event.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{event.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {event.promotions?.name} • {event.city}, {event.state}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6 text-foreground-muted">
              Past Events ({pastEvents.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {pastEvents.slice(0, 10).map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-foreground-muted font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(event.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{event.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {event.promotions?.name} • {event.city}, {event.state}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No events */}
        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-foreground-muted">
              We don't have any events listed for {wrestler.name} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
