'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ExternalLink } from 'lucide-react'

// Platform icons/colors
const platformConfig: Record<string, { emoji: string; color: string }> = {
  'FITE/Triller TV': { emoji: '📺', color: 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' },
  'YouTube': { emoji: '▶️', color: 'bg-red-500/20 text-red-300 hover:bg-red-500/30' },
  'Twitch': { emoji: '🎮', color: 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30' },
  'IWTV': { emoji: '🤼', color: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' },
  'Peacock': { emoji: '🦚', color: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' },
  'Default': { emoji: '📡', color: 'btn-secondary' },
}

function getPlatformConfig(platform: string) {
  return platformConfig[platform] || platformConfig['Default']
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
        const config = getPlatformConfig(link.platform)
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn text-sm ${config.color} transition-colors`}
          >
            <span className="mr-1.5">{config.emoji}</span>
            {link.label || (link.is_live ? `Watch on ${link.platform}` : `VOD on ${link.platform}`)}
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </a>
        )
      })}
    </>
  )
}
