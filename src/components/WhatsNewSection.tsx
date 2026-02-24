'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getActiveHomepageNews } from '@/lib/admin'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper, Crown, Megaphone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: any; iconColor: string; bgColor: string }> = {
  title_change: { icon: Crown, iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/15' },
  new_event: { icon: Calendar, iconColor: 'text-green-400', bgColor: 'bg-green-500/15' },
  announcement: { icon: Megaphone, iconColor: 'text-accent', bgColor: 'bg-accent/15' },
}

export default function WhatsNewSection() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    getActiveHomepageNews().then((data) => {
      setNews(data)
      setLoading(false)
    })
  }, [])

  const checkScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const left = el.scrollLeft > 4
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      setCanScrollLeft(prev => prev !== left ? left : prev)
      setCanScrollRight(prev => prev !== right ? right : prev)
    })
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [news, checkScroll])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > a, :scope > div')?.clientWidth || 300
    el.scrollBy({ left: dir === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' })
  }

  if (loading || news.length === 0) return null

  return (
    <section className="py-8 bg-gradient-to-b from-blue-500/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-5">
          <Newspaper className="w-6 h-6 text-blue-400" />
          What&apos;s New
        </h2>

        <div className="relative group/news">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/news:opacity-100 -translate-x-1/2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent hover:text-white transition-colors opacity-0 group-hover/news:opacity-100 translate-x-1/2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ willChange: 'scroll-position' }}
          >
            {news.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement
              const Icon = config.icon
              const card = (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-background-secondary border border-border hover:border-border-hover transition-colors h-full">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
                    {item.body && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{item.body}</p>
                    )}
                    <p className="text-xs text-foreground-muted/60 mt-1.5">{formatRelativeTime(item.created_at)}</p>
                  </div>
                  {item.image_url && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-background-tertiary">
                      <Image
                        src={item.image_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )

              if (item.link_url) {
                return (
                  <Link
                    key={item.id}
                    href={item.link_url}
                    className="flex-shrink-0 w-[280px] sm:w-[320px] block"
                  >
                    {card}
                  </Link>
                )
              }

              return (
                <div key={item.id} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                  {card}
                </div>
              )
            })}
          </div>

          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
          )}
        </div>
      </div>
    </section>
  )
}
