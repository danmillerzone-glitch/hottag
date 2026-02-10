'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { ExternalLink, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'

interface MerchItem {
  id: string
  title: string
  image_url: string
  link_url: string
  price: string | null
}

export default function MerchGallery({ items }: { items: MerchItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number>(0)

  if (!items || items.length === 0) return null

  function checkScroll() {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      setCanScrollLeft(prev => {
        const v = el.scrollLeft > 4
        return prev !== v ? v : prev
      })
      setCanScrollRight(prev => {
        const v = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
        return prev !== v ? v : prev
      })
    })
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [items])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > a')?.clientWidth || 220
    el.scrollBy({ left: dir === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-accent" />
          Merch
        </h2>
        {items.length > 2 && (
          <div className="flex items-center gap-2">
            {canScrollLeft && (
              <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {canScrollRight && (
              <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ willChange: 'scroll-position' }}
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 w-[200px] sm:w-[240px] block rounded-xl overflow-hidden bg-background-tertiary border border-border hover:border-accent/50 transition-all"
          >
            <div className="relative aspect-square">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="240px"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors line-clamp-2">
                {item.title}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                {item.price && (
                  <span className="text-sm text-accent font-bold">{item.price}</span>
                )}
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  Shop <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
