'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Megaphone, User, Crown } from 'lucide-react'

interface Talent {
  id: string
  announcement_note: string | null
  wrestlers: {
    id: string
    name: string
    slug: string
    photo_url: string | null
  }
}

export default function AnnouncedTalentList({ eventId, championMap = {} }: { eventId: string; championMap?: Record<string, string> }) {
  const [talent, setTalent] = useState<Talent[]>([])

  useEffect(() => {
    loadTalent()
  }, [eventId])

  const loadTalent = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_announced_talent')
      .select(`
        id,
        announcement_note,
        wrestlers (id, name, slug, photo_url)
      `)
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (data && data.length > 0) {
      setTalent(data as unknown as Talent[])
    }
  }

  if (talent.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-accent" />
        Announced Talent
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {talent.map((t) => (
          <Link
            key={t.id}
            href={`/wrestlers/${t.wrestlers.slug}`}
            className="flex flex-col items-center p-3 rounded-lg bg-background-tertiary hover:bg-border transition-colors group"
          >
            <div className={`w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden mb-2 border-2 ${championMap[t.wrestlers.id] ? 'border-yellow-500' : 'border-transparent'}`}>
              {t.wrestlers.photo_url ? (
                <Image
                  src={t.wrestlers.photo_url}
                  alt={t.wrestlers.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-8 h-8 text-foreground-muted" />
              )}
            </div>
            <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2">
              {t.wrestlers.name}
            </span>
            {championMap[t.wrestlers.id] && (
              <span className="flex items-center justify-center gap-0.5 text-xs text-yellow-500 mt-0.5 text-center" title={championMap[t.wrestlers.id]}>
                <Crown className="w-3 h-3 flex-shrink-0" />
                {championMap[t.wrestlers.id]}
              </span>
            )}
            {t.announcement_note && (
              <span className="text-xs text-accent mt-0.5 text-center line-clamp-1">
                {t.announcement_note}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
