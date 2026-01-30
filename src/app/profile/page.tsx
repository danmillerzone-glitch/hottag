'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, 
  Calendar, 
  Users, 
  Building2, 
  MapPin,
  Loader2,
  LogOut,
  Heart,
  Check
} from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [attendingEvents, setAttendingEvents] = useState<any[]>([])
  const [followedWrestlers, setFollowedWrestlers] = useState<any[]>([])
  const [followedPromotions, setFollowedPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/signin')
      return
    }

    const fetchData = async () => {
      setLoading(true)

      // Fetch attending events
      const { data: eventsData } = await supabase
        .from('user_event_attendance')
        .select(`
          id,
          status,
          events (
            id,
            name,
            event_date,
            city,
            state,
            promotions (
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (eventsData) {
        console.log('Events data:', eventsData)
        setAttendingEvents(eventsData)
      }

      // Fetch followed wrestlers
      const { data: wrestlersData } = await supabase
        .from('user_follows_wrestler')
        .select(`
          id,
          wrestlers (
            id,
            name,
            slug,
            photo_url,
            hometown
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (wrestlersData) {
        setFollowedWrestlers(wrestlersData)
      }

      // Fetch followed promotions
      const { data: promotionsData } = await supabase
        .from('user_follows_promotion')
        .select(`
          id,
          promotions (
            id,
            name,
            slug,
            logo_url,
            city,
            state
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (promotionsData) {
        setFollowedPromotions(promotionsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const goingEvents = attendingEvents.filter(e => e.status === 'attending')
  const interestedEvents = attendingEvents.filter(e => e.status === 'interested')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background-secondary py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-12 h-12 text-accent" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
                {user.email}
              </h1>
              <p className="text-foreground-muted mb-4">
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-accent" />
                  <strong>{attendingEvents.length}</strong> events
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-accent" />
                  <strong>{followedWrestlers.length}</strong> wrestlers
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-accent" />
                  <strong>{followedPromotions.length}</strong> promotions
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="btn btn-ghost text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Events I'm Going To */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Events I'm Going To ({goingEvents.length})
          </h2>
          
          {goingEvents.length > 0 ? (
            <div className="space-y-3">
              {goingEvents.map((item) => (
                <Link
                  key={item.id}
                  href={`/events/${item.events.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-accent font-bold text-sm">
                      {new Date(item.events.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-xl font-bold">
                      {new Date(item.events.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.events.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {item.events.promotions?.name} • {item.events.city}, {item.events.state}
                    </div>
                  </div>
                  <span className="badge bg-green-500/20 text-green-400">Going</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">
              You haven't marked any events as "going" yet. <Link href="/events" className="text-accent hover:underline">Browse events</Link>
            </p>
          )}
        </section>

        {/* Events I'm Interested In */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Events I'm Interested In ({interestedEvents.length})
          </h2>
          
          {interestedEvents.length > 0 ? (
            <div className="space-y-3">
              {interestedEvents.map((item) => (
                <Link
                  key={item.id}
                  href={`/events/${item.events.id}`}
                  className="card p-4 flex items-center gap-4 hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-accent font-bold text-sm">
                      {new Date(item.events.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-xl font-bold">
                      {new Date(item.events.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.events.name}</div>
                    <div className="text-sm text-foreground-muted">
                      {item.events.promotions?.name} • {item.events.city}, {item.events.state}
                    </div>
                  </div>
                  <span className="badge bg-pink-500/20 text-pink-400">Interested</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">
              You haven't marked any events as "interested" yet.
            </p>
          )}
        </section>

        {/* Wrestlers I Follow */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Wrestlers I Follow ({followedWrestlers.length})
          </h2>
          
          {followedWrestlers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {followedWrestlers.map((item) => (
                <Link
                  key={item.id}
                  href={`/wrestlers/${item.wrestlers.slug}`}
                  className="card p-4 flex flex-col items-center text-center hover:bg-background-tertiary transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden mb-2">
                    {item.wrestlers.photo_url ? (
                      <Image
                        src={item.wrestlers.photo_url}
                        alt={item.wrestlers.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-foreground-muted" />
                    )}
                  </div>
                  <span className="font-medium text-sm line-clamp-2">{item.wrestlers.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">
              You aren't following any wrestlers yet. <Link href="/wrestlers" className="text-accent hover:underline">Browse wrestlers</Link>
            </p>
          )}
        </section>

        {/* Promotions I Follow */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            Promotions I Follow ({followedPromotions.length})
          </h2>
          
          {followedPromotions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {followedPromotions.map((item) => (
                <Link
                  key={item.id}
                  href={`/promotions/${item.promotions.slug}`}
                  className="card p-4 flex flex-col items-center text-center hover:bg-background-tertiary transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center overflow-hidden mb-2">
                    {item.promotions.logo_url ? (
                      <Image
                        src={item.promotions.logo_url}
                        alt={item.promotions.name}
                        width={64}
                        height={64}
                        className="object-contain w-full h-full p-1"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-foreground-muted" />
                    )}
                  </div>
                  <span className="font-medium text-sm line-clamp-2">{item.promotions.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">
              You aren't following any promotions yet. <Link href="/promotions" className="text-accent hover:underline">Browse promotions</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
