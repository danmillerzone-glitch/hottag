import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background-secondary hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-muted">
              &copy; {new Date().getFullYear()} Hot Tag&trade;. All rights reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/terms" className="text-foreground-muted hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-foreground-muted hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <a
              href="https://x.com/HotTagApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              @HotTagApp
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
