'use client'

import { CalendarPlus } from 'lucide-react'

interface Props {
  eventName: string
  eventDate: string // YYYY-MM-DD
  eventTime?: string | null // HH:MM:SS or HH:MM
  doorsTime?: string | null
  venueName?: string | null
  city?: string | null
  state?: string | null
  venueAddress?: string | null
  description?: string | null
  eventUrl: string
}

function formatDateForCalendar(date: string, time?: string | null): string {
  const d = date.replace(/-/g, '')
  if (time) {
    const t = time.replace(/:/g, '').substring(0, 6).padEnd(6, '0')
    return `${d}T${t}`
  }
  return `${d}T200000` // Default 8 PM
}

function getEndStr(date: string, time?: string | null): string {
  const endDate = new Date(`${date}T${time || '20:00:00'}`)
  endDate.setHours(endDate.getHours() + 3)
  return `${date.replace(/-/g, '')}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`
}

function buildDescription(props: Props): string {
  const lines: string[] = []
  if (props.description) lines.push(props.description)
  if (props.doorsTime) lines.push(`Doors: ${props.doorsTime}`)
  lines.push(`View on Hot Tag: ${props.eventUrl}`)
  return lines.join('\n')
}

function buildLocation(props: Props): string {
  return [props.venueName, props.venueAddress, props.city, props.state].filter(Boolean).join(', ')
}

export default function AddToCalendar(props: Props) {
  const location = buildLocation(props)
  const desc = buildDescription(props)

  const handleGoogle = () => {
    const start = formatDateForCalendar(props.eventDate, props.eventTime)
    const endStr = getEndStr(props.eventDate, props.eventTime)

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: props.eventName,
      dates: `${start}/${endStr}`,
      details: desc,
      location: location,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
  }

  const handleICS = () => {
    const start = formatDateForCalendar(props.eventDate, props.eventTime)
    const endStr = getEndStr(props.eventDate, props.eventTime)

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hot Tag//Event//EN',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${endStr}`,
      `SUMMARY:${props.eventName}`,
      `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `URL:${props.eventUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGoogle}
        className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
        title="Add to Google Calendar"
        aria-label="Add to Google Calendar"
      >
        <GoogleCalIcon className="w-5 h-5" />
      </button>
      <button
        onClick={handleICS}
        className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
        title="Add to Apple / Outlook Calendar"
        aria-label="Add to Apple / Outlook Calendar"
      >
        <CalendarPlus className="w-5 h-5 text-foreground-muted" />
      </button>
    </div>
  )
}

function GoogleCalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M18 3h-1V2a1 1 0 0 0-2 0v1H9V2a1 1 0 0 0-2 0v1H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.3" />
      <path d="M18 5H6a1 1 0 0 0-1 1v2h14V6a1 1 0 0 0-1-1z" fill="#4285F4" />
      <rect x="7" y="10" width="3" height="3" rx="0.5" fill="#EA4335" />
      <rect x="7" y="14.5" width="3" height="3" rx="0.5" fill="#FBBC05" />
      <rect x="11.5" y="10" width="3" height="3" rx="0.5" fill="#34A853" />
      <rect x="11.5" y="14.5" width="3" height="3" rx="0.5" fill="#4285F4" />
    </svg>
  )
}
