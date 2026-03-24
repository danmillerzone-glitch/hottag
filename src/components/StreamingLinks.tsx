'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ExternalLink } from 'lucide-react'

const LOGO_BASE = 'https://auth.hottag.app/storage/v1/object/public/streaming-logos'

// Platform config: image-based logos with fallback SVGs
// To add a logo: upload a PNG to the streaming-logos bucket in Supabase Storage
// The key matches the filename used below (lowercase, hyphenated)
const platformConfig: Record<string, {
  logoFile: string | null
  svgFallback: React.ReactNode
  btnClass: string
}> = {
  'YouTube': {
    logoFile: 'youtube.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    btnClass: 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/20',
  },
  'Twitch': {
    logoFile: 'twitch.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
    btnClass: 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-600/20',
  },
  'FITE/Triller TV': {
    logoFile: 'triller-tv.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <polygon points="10,8 10,16 16,12" fill="currentColor"/>
      </svg>
    ),
    btnClass: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/20',
  },
  'IWTV': {
    logoFile: 'iwtv.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    btnClass: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/20',
  },
  'Peacock': {
    logoFile: 'peacock.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    btnClass: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/20',
  },
  'Title Match Network': {
    logoFile: 'title-match-network.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    btnClass: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20',
  },
  'Highspots Wrestling Network': {
    logoFile: 'highspots.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    btnClass: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/20',
  },
  'Facebook Live': {
    logoFile: 'facebook-live.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    btnClass: 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/20',
  },
  'X/Twitter': {
    logoFile: 'x-twitter.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    btnClass: 'bg-neutral-500/20 text-neutral-300 hover:bg-neutral-500/30 border border-neutral-500/20',
  },
  'TikTok': {
    logoFile: 'tiktok.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004c-.097-.573-.064-.943-.058-.943h-3.12v14.966c0 .201 0 .399-.008.595 0 .024-.003.046-.004.073 0 .012-.002.024-.003.036v.007a3.205 3.205 0 0 1-1.579 2.415 3.168 3.168 0 0 1-1.573.42 3.21 3.21 0 0 1-3.209-3.21 3.21 3.21 0 0 1 3.209-3.209c.339 0 .666.054.973.153l.004-3.183a6.393 6.393 0 0 0-4.995 1.494 6.726 6.726 0 0 0-1.218 1.408c-.112.178-.645 1.085-.696 2.9-.033 1.048.273 2.134.273 2.134.171.535.557 1.478 1.147 2.249a7.108 7.108 0 0 0 1.633 1.582s.058.031.152.081v-.002a6.413 6.413 0 0 0 3.725 1.09c.393 0 .769-.04 1.13-.113 1.198-.242 2.233-.84 3.033-1.69a6.397 6.397 0 0 0 1.603-3.202c.09-.461.131-.997.131-1.398V9.385a9.088 9.088 0 0 0 2.123 1.046 9.283 9.283 0 0 0 1.591.36V7.685c-.32.035-1.286-.073-2.382-.768z"/>
      </svg>
    ),
    btnClass: 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/20',
  },
  'Patreon': {
    logoFile: 'patreon.png',
    svgFallback: (
      <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524zM.003 23.537h4.22V.524H.003z"/>
      </svg>
    ),
    btnClass: 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 border border-orange-600/20',
  },
}

const defaultConfig = {
  logoFile: null,
  svgFallback: (
    <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  btnClass: 'bg-foreground-muted/10 text-foreground-muted hover:bg-foreground-muted/20 border border-border',
}

function getConfig(platform: string) {
  return platformConfig[platform] || defaultConfig
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
      {links.map((link) => (
        <StreamingButton key={link.id} link={link} />
      ))}
    </>
  )
}

function StreamingButton({ link }: { link: StreamingLink }) {
  const config = getConfig(link.platform)
  const [imgFailed, setImgFailed] = useState(false)
  const showLogo = config.logoFile && !imgFailed

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${
        showLogo
          ? 'px-3 py-1.5 hover:bg-white/10 border border-border'
          : `px-4 py-2 ${config.btnClass}`
      }`}
    >
      {showLogo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`${LOGO_BASE}/${config.logoFile}`}
          alt={link.platform}
          className="h-8 w-auto max-w-[160px]"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <>
          {config.svgFallback}
          <span>{link.label || (link.is_live ? `Watch on ${link.platform}` : `VOD on ${link.platform}`)}</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </>
      )}
    </a>
  )
}
