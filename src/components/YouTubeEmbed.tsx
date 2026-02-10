'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
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
  const [playing, setPlaying] = useState(false)
  const videoId = getYouTubeId(url)

  if (!videoId) return null

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
      {!playing ? (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 w-full h-full group cursor-pointer z-10"
          aria-label={`Play ${title || 'video'}`}
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title || 'Video thumbnail'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/90 group-hover:bg-accent group-hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-2xl">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
            </div>
          </div>
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-sm font-semibold text-white drop-shadow-lg">{title}</p>
            </div>
          )}
        </button>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title || 'Featured video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      )}
    </div>
  )
}
