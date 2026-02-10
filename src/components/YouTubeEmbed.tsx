'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

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

export default function YouTubeEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  const videoId = getYouTubeId(url)

  if (!videoId) return null

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-background-tertiary">
      {!loaded ? (
        /* Lazy-load: show thumbnail with play button, load iframe on click */
        <button
          onClick={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full group cursor-pointer"
        >
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-accent/90 group-hover:bg-accent flex items-center justify-center transition-colors shadow-xl">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </div>
        </button>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      )}
    </div>
  )
}
