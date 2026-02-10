'use client'

import { ExternalLink, Play } from 'lucide-react'

function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

interface YouTubeEmbedProps {
  url: string
  title?: string | null
}

export default function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-background-tertiary border border-border hover:border-accent/50 transition-colors"
      >
        <Play className="w-5 h-5 text-accent" />
        <span className="font-semibold text-sm">{title || 'Watch Video'}</span>
        <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
      </a>
    )
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={title || 'Featured video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
      />
    </div>
  )
}
