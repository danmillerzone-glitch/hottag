import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getWrestlers } from '@/lib/supabase'
import { User, MapPin, Calendar, Users } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export const revalidate = 300

async function WrestlersList() {
  const wrestlers = await getWrestlers(500)

  if (wrestlers.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 mx-auto text-foreground-muted mb-4" />
        <h3 className="text-xl font-semibold mb-2">No wrestlers yet</h3>
        <p className="text-foreground-muted">
          Wrestler profiles will appear here as we scrape event data.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {wrestlers.map((wrestler) => (
        <Link
          key={wrestler.id}
          href={`/wrestlers/${wrestler.slug}`}
          className="card p-5 hover:border-accent/50 transition-colors group"
        >
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {wrestler.photo_url ? (
                <Image
                  src={wrestler.photo_url}
                  alt={wrestler.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-8 h-8 text-foreground-muted" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                {wrestler.name}
              </h3>
              
              {wrestler.hometown && (
                <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{wrestler.hometown}</span>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm text-foreground-muted">
                {wrestler.follower_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatNumber(wrestler.follower_count)}
                  </div>
                )}
                {wrestler.upcoming_events_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {wrestler.upcoming_events_count} upcoming
                  </div>
                )}
              </div>

              {wrestler.verification_status === 'verified' && (
                <div className="mt-2">
                  <span className="badge bg-accent/20 text-accent text-xs">
                    ✓ Verified
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function WrestlersListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 skeleton rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 skeleton" />
              <div className="h-4 w-24 skeleton" />
              <div className="h-4 w-20 skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WrestlersPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Wrestlers</h1>
          <p className="text-foreground-muted">
            Follow your favorite indie wrestlers and track their upcoming appearances
          </p>
        </div>

        {/* Search/Filter - placeholder for now */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search wrestlers..."
            className="w-full md:w-80 px-4 py-2 rounded-lg bg-background-secondary border border-border focus:border-accent focus:outline-none text-foreground placeholder-foreground-muted"
          />
        </div>

        {/* List */}
        <Suspense fallback={<WrestlersListSkeleton />}>
          <WrestlersList />
        </Suspense>
      </div>
    </div>
  )
}
