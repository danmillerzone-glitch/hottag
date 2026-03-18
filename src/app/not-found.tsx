import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-accent mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-foreground-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/events"
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Browse Events
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 bg-background-tertiary text-foreground rounded-lg font-medium hover:bg-background-tertiary/80 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
