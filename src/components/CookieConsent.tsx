'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-background-secondary border border-border rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-foreground-muted flex-1">
          We use essential cookies to keep you signed in and make the site work. No tracking cookies.{' '}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Got it
          </button>
          <button
            onClick={accept}
            className="p-1.5 text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Dismiss cookie notice"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
