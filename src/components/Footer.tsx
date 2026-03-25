import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background-secondary pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
            <Link href="/terms" className="text-foreground-muted hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-foreground-muted hover:text-foreground transition-colors">
              Privacy
            </Link>
            <a
              href="https://www.patreon.com/HotTagApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Patreon
            </a>
            <a
              href="https://x.com/HotTagApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              @HotTagApp
            </a>
            <a
              href="https://x.com/HotTagApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Report a Problem
            </a>
            <Link href="/blog" className="text-foreground-muted hover:text-foreground transition-colors">
              Dev Blog
            </Link>
          </nav>
          <span className="text-xs text-foreground-muted">
            &copy; {new Date().getFullYear()} Hot Tag LLC
          </span>
        </div>
      </div>
    </footer>
  )
}
