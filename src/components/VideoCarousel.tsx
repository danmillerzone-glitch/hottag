'use client'

import { useRef, useState, useEffect } from 'react'
import { Youtube, ChevronLeft, ChevronRight } from 'lucide-react'
import YouTubeEmbed from './YouTubeEmbed'

interface Video {
  id: string
  title: string | null
  url: string
}

interface VideoCarouselProps {
  videos: Video[]
  sectionTitle?: string | null
}

export default function VideoCarousel({ videos, sectionTitle }: VideoCarouselProps) {
  if (!videos || videos.length === 0) return null

  // Single video — no carousel needed
  if (videos.length === 1) {
    return (
      <div>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          {sectionTitle || videos[0].title || 'Featured Video'}
        </h2>
        <YouTubeEmbed url={videos[0].url} title={videos[0].title} />
      </div>
    )
  }

  // Multiple videos — carousel
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          {sectionTitle || 'Videos'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-foreground-muted">{activeIndex + 1} / {videos.length}</span>
          <button
            onClick={() => setActiveIndex(Math.min(videos.length - 1, activeIndex + 1))}
            disabled={activeIndex === videos.length - 1}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active video */}
      <YouTubeEmbed url={videos[activeIndex].url} title={videos[activeIndex].title} />

      {/* Video titles strip */}
      {videos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {videos.map((video, i) => (
            <button
              key={video.id}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                i === activeIndex
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-background-tertiary text-foreground-muted hover:text-foreground border border-border'
              }`}
            >
              {video.title || `Video ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
