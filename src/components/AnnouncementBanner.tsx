'use client'

import { useState, useEffect } from 'react'
import { getActiveAnnouncements } from '@/lib/admin'
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react'
import Link from 'next/link'

const typeStyles: Record<string, { bg: string; border: string; icon: any; iconColor: string }> = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, iconColor: 'text-blue-400' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle, iconColor: 'text-yellow-400' },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle, iconColor: 'text-green-400' },
  promo: { bg: 'bg-accent/10', border: 'border-accent/30', icon: Megaphone, iconColor: 'text-accent' },
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    getActiveAnnouncements().then(setAnnouncements)
  }, [])

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-0">
      {visible.map((announcement) => {
        const style = typeStyles[announcement.type] || typeStyles.info
        const Icon = style.icon
        return (
          <div
            key={announcement.id}
            className={`${style.bg} border-b ${style.border} px-4 py-2.5`}
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <Icon className={`w-4 h-4 flex-shrink-0 ${style.iconColor}`} />
              <p className="flex-1 text-sm">
                {announcement.message}
                {announcement.link_url && (
                  <>
                    {' '}
                    <Link href={announcement.link_url} className="text-accent hover:underline font-medium">
                      {announcement.link_text || 'Learn more →'}
                    </Link>
                  </>
                )}
              </p>
              <button
                onClick={() => setDismissed(prev => { const next = new Set(prev); next.add(announcement.id); return next })}
                className="flex-shrink-0 p-1 hover:bg-background-tertiary rounded transition-colors"
              >
                <X className="w-4 h-4 text-foreground-muted" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
