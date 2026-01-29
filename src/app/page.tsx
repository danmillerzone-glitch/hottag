import { Suspense } from 'react'
import { getUpcomingEvents, getPromotions } from '@/lib/supabase'
import { EventCard, EventCardSkeleton } from '@/components/EventCard'
import { Calendar, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300 // Revalidate every 5 minutes

async function FeaturedEvents() {
  const events = await getUpcomingEvents(3)
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto text-foreground-muted mb-4" />
        <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
        <p className="text-foreground-muted">Check back soon for new shows!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.slice(0, 3).map((event) => (
        <EventCard key={event.id} event={event} variant="featured" />
      ))}
    </div>
  )
}

async function UpcomingEvents() {
  const events = await getUpcomingEvents(20)
  
  if (events.length === 0) {
    return null
  }

  // Skip the first 3 (featured)
  const remainingEvents = events.slice(3)
  
  if (remainingEvents.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {remainingEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

async function PromotionsList() {
  const promotions = await getPromotions(12)
  
  return (
    <div className="flex flex-wrap gap-2">
      {promotions.map((promo) => (
        <Link
          key={promo.id}
          href={`/promotions/${promo.slug}`}
          className="px-4 py-2 rounded-full bg-background-tertiary text-foreground-muted hover:text-foreground hover:bg-border transition-colors text-sm font-medium"
        >
          {promo.name}
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background-secondary to-background py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              Never miss another{' '}
              <span className="text-accent">indie show</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground-muted mb-8">
              Discover wrestling events across the United States. Follow your favorite wrestlers. 
              Connect with the indie wrestling community.
            </p>
            
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/map" 
                className="btn btn-primary"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Find Events Near Me
              </Link>
              <Link 
                href="/events" 
                className="btn btn-secondary"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Browse All Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-accent" />
              Coming Up
            </h2>
            <Link href="/events" className="text-accent hover:text-accent-hover font-medium text-sm">
              View all →
            </Link>
          </div>
          
          <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <EventCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          }>
            <FeaturedEvents />
          </Suspense>
        </div>
      </section>

      {/* More Events */}
      <section className="py-12 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-display font-bold mb-6">More Events</h2>
          
          <Suspense fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          }>
            <UpcomingEvents />
          </Suspense>
        </div>
      </section>

      {/* Promotions */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Promotions</h2>
            <Link href="/promotions" className="text-accent hover:text-accent-hover font-medium text-sm">
              View all →
            </Link>
          </div>
          
          <Suspense fallback={
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 w-32 skeleton rounded-full" />
              ))}
            </div>
          }>
            <PromotionsList />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-accent/10 to-accent-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Are you a wrestler or promotion?
          </h2>
          <p className="text-foreground-muted mb-8 max-w-2xl mx-auto">
            Claim your page to manage your schedule, connect with fans, and promote your events.
          </p>
          <button className="btn btn-primary">
            Claim Your Page
          </button>
        </div>
      </section>
    </div>
  )
}
