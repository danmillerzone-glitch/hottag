'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

interface Props {
  eventDate: string // YYYY-MM-DD
  eventTime?: string | null // HH:MM:SS or HH:MM
}

export default function EventCountdown({ eventDate, eventTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    function getTarget() {
      if (eventTime) {
        // Combine date + time
        const timePart = eventTime.length === 5 ? `${eventTime}:00` : eventTime
        return new Date(`${eventDate}T${timePart}`)
      }
      // No time — assume 8 PM local as a reasonable bell time default
      return new Date(`${eventDate}T20:00:00`)
    }

    function update() {
      const target = getTarget()
      const now = new Date()
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setIsPast(true)
        setTimeLeft(null)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ days, hours, minutes, seconds })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [eventDate, eventTime])

  if (isPast || !timeLeft) return null

  // Only show days if more than 1 day away
  const showDays = timeLeft.days > 0

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
      <Timer className="w-5 h-5 text-accent flex-shrink-0" />
      <div className="flex items-baseline gap-1">
        <span className="text-sm text-foreground-muted mr-1">Starts in</span>
        {showDays && (
          <>
            <span className="text-xl font-bold text-accent tabular-nums">{timeLeft.days}</span>
            <span className="text-sm text-foreground-muted mr-2">{timeLeft.days === 1 ? 'day' : 'days'}</span>
          </>
        )}
        <span className="text-xl font-bold text-accent tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-sm text-foreground-muted">h</span>
        <span className="text-xl font-bold text-accent tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-sm text-foreground-muted">m</span>
        {!showDays && (
          <>
            <span className="text-xl font-bold text-accent tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-sm text-foreground-muted">s</span>
          </>
        )}
      </div>
    </div>
  )
}
