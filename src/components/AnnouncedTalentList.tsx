'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Megaphone, User, Briefcase } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/supabase'

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

interface CrewMember {
  id: string
  announcement_note: string | null
  professionals: {
    id: string
    name: string
    slug: string
    photo_url: string | null
    role: string[]
  }
}

export default function AnnouncedTalentList({ eventId, championMap = {} }: { eventId: string; championMap?: Record<string, string> }) {
  const [talent, setTalent] = useState<Talent[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    const supabase = createClient()
    const [talentRes, crewRes] = await Promise.all([
      supabase
        .from('event_announced_talent')
        .select('id, announcement_note, wrestlers (id, name, slug, photo_url)')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('event_announced_crew')
        .select('id, announcement_note, professionals (id, name, slug, photo_url, role)')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true })
    ])

    if (talentRes.data && talentRes.data.length > 0) {
      setTalent(talentRes.data as unknown as Talent[])
    }
    if (crewRes.data && crewRes.data.length > 0) {
      setCrew(crewRes.data as unknown as CrewMember[])
    }
  }

  if (talent.length === 0 && crew.length === 0) return null

  return (
    <div className="mb-8">
      {talent.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent" />
            Announced Talent
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {talent.map((t) => (
              <Link
                key={t.id}
                href={`/wrestlers/${t.wrestlers.slug}`}
                className="flex flex-col items-center p-3 rounded-lg bg-background-tertiary hover:bg-border transition-colors group"
              >
                <div className={`w-16 h-16 rounded-xl bg-background flex items-center justify-center overflow-hidden mb-2 border-2 ${championMap[t.wrestlers.id] ? 'border-yellow-500' : 'border-transparent'}`}>
                  {t.wrestlers.photo_url ? (
                    <Image
                      src={t.wrestlers.photo_url}
                      alt={t.wrestlers.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      sizes="64px"
                    />
                  ) : (
                    <User className="w-8 h-8 text-foreground-muted" />
                  )}
                </div>
                <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2 w-full">
                  {t.wrestlers.name}
                </span>
                {championMap[t.wrestlers.id] && (
                  <div className="flex flex-col items-center mt-0.5 w-full" title={championMap[t.wrestlers.id]}>
                    <span className="text-xs text-yellow-500 text-center leading-tight">{championMap[t.wrestlers.id]}</span>
                  </div>
                )}
                {t.announcement_note && (
                  <span className="text-xs text-accent mt-0.5 text-center line-clamp-1 w-full">
                    {t.announcement_note}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {crew.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Announced Crew
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {crew.map((c) => (
              <Link
                key={c.id}
                href={`/crew/${c.professionals.slug}`}
                className="flex flex-col items-center p-3 rounded-lg bg-background-tertiary hover:bg-border transition-colors group"
              >
                <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center overflow-hidden mb-2 border-2 border-transparent">
                  {c.professionals.photo_url ? (
                    <Image
                      src={c.professionals.photo_url}
                      alt={c.professionals.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      sizes="64px"
                    />
                  ) : (
                    <Briefcase className="w-8 h-8 text-foreground-muted" />
                  )}
                </div>
                <span className="text-sm font-medium text-center group-hover:text-accent transition-colors line-clamp-2 w-full">
                  {c.professionals.name}
                </span>
                <span className="text-[10px] text-purple-400 mt-0.5 text-center line-clamp-1 w-full">
                  {c.professionals.role?.map(r => ROLE_LABELS[r] || r).join(' / ')}
                </span>
                {c.announcement_note && (
                  <span className="text-xs text-accent mt-0.5 text-center line-clamp-1 w-full">
                    {c.announcement_note}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
