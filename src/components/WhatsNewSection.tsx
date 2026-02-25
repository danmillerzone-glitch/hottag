'use client'

import { useState, useEffect } from 'react'
import { getActiveHomepageNews } from '@/lib/admin'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { Newspaper, Crown, Megaphone, Calendar } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: any; iconColor: string; bgColor: string; label: string }> = {
  title_change: { icon: Crown, iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/15', label: 'Title Change' },
  new_event: { icon: Calendar, iconColor: 'text-green-400', bgColor: 'bg-green-500/15', label: 'New Event' },
  announcement: { icon: Megaphone, iconColor: 'text-accent', bgColor: 'bg-accent/15', label: 'Announcement' },
}

function NewsCardWrapper({ item, children }: { item: any; children: React.ReactNode }) {
  if (item.link_url) {
    return <Link href={item.link_url} className="block h-full">{children}</Link>
  }
  return <>{children}</>
}

function FeaturedNewsCard({ item }: { item: any }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement
  const Icon = config.icon

  return (
    <NewsCardWrapper item={item}>
      <div className="rounded-xl bg-background-secondary border border-border hover:border-border-hover transition-colors overflow-hidden group">
        <div className="flex flex-col md:flex-row">
          {item.image_url && (
            <div className="md:w-2/5 aspect-video md:aspect-auto md:min-h-[200px] relative bg-background-tertiary flex-shrink-0">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className={`flex-1 p-5 md:p-6 flex flex-col justify-center ${!item.image_url ? 'py-8' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${config.bgColor} ${config.iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </span>
              <span className="text-xs text-foreground-muted/60">{formatRelativeTime(item.display_date || item.created_at)}</span>
            </div>
            <h3 className="text-lg md:text-xl font-display font-bold leading-snug mb-2 group-hover:text-accent transition-colors">
              {item.title}
            </h3>
            {item.body && (
              <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3">
                {item.body}
              </p>
            )}
          </div>
        </div>
      </div>
    </NewsCardWrapper>
  )
}

function NewsCard({ item }: { item: any }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement
  const Icon = config.icon

  return (
    <NewsCardWrapper item={item}>
      <div className="rounded-xl bg-background-secondary border border-border hover:border-border-hover transition-colors overflow-hidden group h-full">
        {item.image_url && (
          <div className="aspect-video relative bg-background-tertiary">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.bgColor} ${config.iconColor}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-foreground-muted/60">{formatRelativeTime(item.display_date || item.created_at)}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug mb-1.5 group-hover:text-accent transition-colors line-clamp-2">
            {item.title}
          </h3>
          {item.body && (
            <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
              {item.body}
            </p>
          )}
        </div>
      </div>
    </NewsCardWrapper>
  )
}

export default function WhatsNewSection() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveHomepageNews().then((data) => {
      setNews(data)
      setLoading(false)
    })
  }, [])

  if (loading || news.length === 0) return null

  const featuredItems = news.filter((item: any) => item.size === 'featured')
  const smallItems = news.filter((item: any) => item.size !== 'featured')

  return (
    <section className="py-8 bg-gradient-to-b from-blue-500/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-5">
          <Newspaper className="w-6 h-6 text-blue-400" />
          What&apos;s New
        </h2>

        {featuredItems.length > 0 && (
          <div className="space-y-4">
            {featuredItems.map((item: any) => (
              <FeaturedNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {smallItems.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${featuredItems.length > 0 ? 'mt-4' : ''}`}>
            {smallItems.slice(0, 6).map((item: any) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
