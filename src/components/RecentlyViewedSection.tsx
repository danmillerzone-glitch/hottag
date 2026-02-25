'use client'

import { useState, useEffect } from 'react'
import { getRecentlyViewed, type RecentItem } from '@/lib/recently-viewed'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Calendar, User, Building2 } from 'lucide-react'

function getLink(item: RecentItem): string {
  switch (item.type) {
    case 'event': return `/events/${item.id}`
    case 'wrestler': return `/wrestlers/${item.slug || item.id}`
    case 'promotion': return `/promotions/${item.slug || item.id}`
  }
}

function TypeIcon({ type }: { type: RecentItem['type'] }) {
  switch (type) {
    case 'event': return <Calendar className="w-3 h-3" />
    case 'wrestler': return <User className="w-3 h-3" />
    case 'promotion': return <Building2 className="w-3 h-3" />
  }
}

export default function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    setItems(getRecentlyViewed())
  }, [])

  if (items.length === 0) return null

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-foreground-muted" />
          Recently Viewed
        </h2>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={getLink(item)}
              className="flex-shrink-0 w-[160px] group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary mb-2">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="160px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon type={item.type} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 drop-shadow-lg">
                    {item.name}
                  </span>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-foreground-muted capitalize">
                    <TypeIcon type={item.type} />
                    {item.type}
                  </span>
                </div>
              </div>
              {item.subtitle && (
                <p className="text-xs text-foreground-muted truncate">{item.subtitle}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
