'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, X, Check, Copy } from 'lucide-react'

// SVG icons for social platforms (inline to avoid dependencies)
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface ShareButtonProps {
  title: string
  text: string
  url: string
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMenu(false)
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu])

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        // User cancelled or error - fall through to menu
      }
    }
    setShowMenu(!showMenu)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    { name: 'X / Twitter', icon: <TwitterIcon />, href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, color: 'hover:text-foreground' },
    { name: 'Facebook', icon: <FacebookIcon />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'hover:text-blue-500' },
    { name: 'Reddit', icon: <RedditIcon />, href: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, color: 'hover:text-orange-500' },
    { name: 'WhatsApp', icon: <WhatsAppIcon />, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`, color: 'hover:text-green-500' },
    { name: 'Email', icon: <EmailIcon />, href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`, color: 'hover:text-accent' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={handleShare} aria-label={`Share ${title}`} aria-expanded={showMenu} aria-haspopup="true" className="btn btn-secondary">
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </button>

      {showMenu && (
        <div role="menu" aria-label="Share options" className="absolute top-full mt-2 right-0 sm:left-0 w-64 bg-background-secondary border border-border rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Share</span>
            <button onClick={() => setShowMenu(false)} aria-label="Close share menu" className="p-1 rounded hover:bg-background-tertiary">
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          <div className="p-2">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target={link.name === 'Email' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground-muted ${link.color} hover:bg-background-tertiary transition-colors text-sm`}
              >
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors text-sm"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'Link copied!' : 'Copy link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
