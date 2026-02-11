'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, ExternalLink, X } from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
}

export default function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null)

  if (!items || items.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-accent" />
        Portfolio
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item)}
            className="group block rounded-xl overflow-hidden bg-background-tertiary border border-border hover:border-accent/50 transition-all text-left"
          >
            <div className="relative aspect-square">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 200px"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full" style={{ maxHeight: '75vh' }}>
              <img src={lightbox.image_url} alt={lightbox.title} className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
            </div>
            <div className="mt-3 text-center">
              <p className="text-white font-semibold text-lg">{lightbox.title}</p>
              {lightbox.description && <p className="text-white/60 text-sm mt-1">{lightbox.description}</p>}
              {lightbox.link_url && (
                <a href={lightbox.link_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-accent hover:underline text-sm">
                  View Full <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
