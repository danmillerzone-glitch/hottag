'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useAuthModal } from '@/lib/auth-modal-context'

export default function AuthModal() {
  const { isOpen, message, closeAuthModal } = useAuthModal()
  const modalRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableEls = modal.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstEl = focusableEls[0]
    const lastEl = focusableEls[focusableEls.length - 1]

    firstEl?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal()
        return
      }
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeAuthModal])

  if (!isOpen) return null

  const redirect = encodeURIComponent(pathname)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-message"
        className="relative w-full max-w-sm bg-background-secondary border border-border rounded-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 p-1 text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-modal-message" className="text-lg font-display font-bold text-center mb-2 pr-6">
          {message}
        </h2>
        <p className="text-sm text-foreground-muted text-center mb-6">
          Create a free account or sign in to continue.
        </p>

        <div className="space-y-3">
          <Link
            href={`/signup?redirect=${redirect}`}
            className="btn btn-primary w-full flex items-center justify-center"
            onClick={closeAuthModal}
          >
            Sign Up Free
          </Link>
          <Link
            href={`/signin?redirect=${redirect}`}
            className="btn btn-secondary w-full flex items-center justify-center"
            onClick={closeAuthModal}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
