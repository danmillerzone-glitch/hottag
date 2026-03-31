'use client'

import Link from 'next/link'

export default function SignupBanner() {
  return (
    <section className="py-6 bg-gradient-to-r from-accent/10 to-accent-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-display font-bold">
            Discover indie wrestling near you
          </h2>
          <p className="text-sm text-foreground-muted mt-1">
            Follow wrestlers, track events, get personalized recommendations. Free forever.
          </p>
        </div>
        <Link href="/signup" className="btn btn-primary whitespace-nowrap">
          Sign Up Free
        </Link>
      </div>
    </section>
  )
}
