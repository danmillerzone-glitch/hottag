'use client'

import Link from 'next/link'

export default function SignupBanner() {
  return (
    <section className="py-8 bg-background-secondary border-y-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-display font-bold">
            Discover indie wrestling near you
          </h2>
          <p className="text-sm text-foreground-muted mt-1.5">
            Follow wrestlers, track events, get personalized recommendations. Free forever.
          </p>
        </div>
        <Link href="/signup" className="btn btn-primary text-base px-6 py-3 whitespace-nowrap">
          Sign Up Free
        </Link>
      </div>
    </section>
  )
}
