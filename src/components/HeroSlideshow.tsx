'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroImage {
  id: string
  image_url: string
  title: string | null
  subtitle: string | null
  link_url: string | null
}

interface HeroSlideshowProps {
  images: HeroImage[]
}

export default function HeroSlideshow({ images }: HeroSlideshowProps) {
  const [current, setCurrent] = useState(0)
  const hasImages = images.length > 0
  const multi = images.length > 1

  // Auto-cycle every 5 seconds
  useEffect(() => {
    if (!multi) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [images.length, multi])

  return (
    <section className="relative overflow-hidden bg-background-secondary" style={{ minHeight: hasImages ? '480px' : undefined, maxHeight: '600px' }}>
      {/* Slideshow images */}
      {hasImages && images.map((img, i) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.image_url}
            alt={img.title || 'Hot Tag'}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-12 md:pb-16 flex items-end" style={{ minHeight: 'inherit' }}>
        <div className="max-w-3xl">
          {/* Show slide-specific title/subtitle if available */}
          {hasImages && images[current]?.title ? (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 drop-shadow-lg">
                {images[current].title}
              </h1>
              {images[current].subtitle && (
                <p className="text-lg md:text-xl text-white/80 mb-8 drop-shadow">
                  {images[current].subtitle}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 drop-shadow-lg">
                Never miss another{' '}
                <span className="text-accent">indie show</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 drop-shadow">
                Discover wrestling events around the world. Follow your favorite wrestlers.
                Connect with the indie wrestling community.
              </p>
            </>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            {hasImages && images[current]?.link_url ? (
              <Link href={images[current].link_url!} className="btn btn-primary">
                Learn More
              </Link>
            ) : null}
            <Link href="/map" className="btn btn-primary">
              <MapPin className="w-4 h-4 mr-2" />
              Find Events Near Me
            </Link>
            <Link href="/events" className="btn btn-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Browse All Events
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      {multi && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-8 h-2 bg-accent'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev/Next arrows */}
      {multi && (
        <>
          <button
            onClick={() => setCurrent((current - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((current + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Fallback when no images */}
      {!hasImages && (
        <div className="absolute inset-0 bg-gradient-to-b from-background-secondary to-background" />
      )}
    </section>
  )
}
