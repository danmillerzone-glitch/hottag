'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ExternalLink } from 'lucide-react'

// Platform logo SVGs
function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TwitchLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
}

function FITELogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <polygon points="10,8 10,16 16,12" fill="currentColor"/>
    </svg>
  )
}

function IWTVLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8"/><path d="M12 17v4"/>
    </svg>
  )
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function DefaultStreamLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

// Platform config with logos and colors
const platformConfig: Record<string, { Logo: React.FC<{ className?: string }>; btnClass: string }> = {
  'YouTube': { Logo: YouTubeLogo, btnClass: 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/20' },
  'Twitch': { Logo: TwitchLogo, btnClass: 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-600/20' },
  'FITE/Triller TV': { Logo: FITELogo, btnClass: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/20' },
  'IWTV': { Logo: IWTVLogo, btnClass: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/20' },
  'Peacock': { Logo: DefaultStreamLogo, btnClass: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/20' },
  'Title Match Network': { Logo: IWTVLogo, btnClass: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20' },
  'Highspots Wrestling Network': { Logo: IWTVLogo, btnClass: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/20' },
  'Facebook Live': { Logo: FacebookLogo, btnClass: 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/20' },
  'X/Twitter': { Logo: XLogo, btnClass: 'bg-neutral-500/20 text-neutral-300 hover:bg-neutral-500/30 border border-neutral-500/20' },
}

function getConfig(platform: string) {
  return platformConfig[platform] || { Logo: DefaultStreamLogo, btnClass: 'bg-foreground-muted/10 text-foreground-muted hover:bg-foreground-muted/20 border border-border' }
}

interface StreamingLink {
  id: string
  platform: string
  url: string
  label: string | null
  is_live: boolean
}

export default function StreamingLinks({ eventId }: { eventId: string }) {
  const [links, setLinks] = useState<StreamingLink[]>([])

  useEffect(() => {
    loadLinks()
  }, [eventId])

  const loadLinks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_streaming_links')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setLinks(data)
    }
  }

  if (links.length === 0) return null

  return (
    <>
      {links.map((link) => {
        const { Logo, btnClass } = getConfig(link.platform)
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnClass}`}
          >
            <Logo className="w-4 h-4" />
            {link.label || (link.is_live ? `Watch on ${link.platform}` : `VOD on ${link.platform}`)}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        )
      })}
    </>
  )
}
