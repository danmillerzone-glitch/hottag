'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'

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

function formatDateForGoogle(date: string, time?: string | null): string {
  // Google Calendar format: YYYYMMDDTHHmmSS
  const d = date.replace(/-/g, '')
  if (time) {
    const t = time.replace(/:/g, '').substring(0, 6).padEnd(6, '0')
    return `${d}T${t}`
  }
  return `${d}T200000` // Default 8 PM
}

function formatDateForICS(date: string, time?: string | null): string {
  const d = date.replace(/-/g, '')
  if (time) {
    const t = time.replace(/:/g, '').substring(0, 6).padEnd(6, '0')
    return `${d}T${t}`
  }
  return `${d}T200000`
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const location = buildLocation(props)
  const desc = buildDescription(props)

  const handleGoogle = () => {
    const start = formatDateForGoogle(props.eventDate, props.eventTime)
    // Assume 3 hour event
    const endDate = new Date(`${props.eventDate}T${props.eventTime || '20:00:00'}`)
    endDate.setHours(endDate.getHours() + 3)
    const endStr = `${props.eventDate.replace(/-/g, '')}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: props.eventName,
      dates: `${start}/${endStr}`,
      details: desc,
      location: location,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
    setOpen(false)
  }

  const handleICS = () => {
    const start = formatDateForICS(props.eventDate, props.eventTime)
    const endDate = new Date(`${props.eventDate}T${props.eventTime || '20:00:00'}`)
    endDate.setHours(endDate.getHours() + 3)
    const endStr = `${props.eventDate.replace(/-/g, '')}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`

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
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost flex items-center gap-2"
      >
        <CalendarPlus className="w-4 h-4" />
        Add to Calendar
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 py-1 rounded-lg bg-background-secondary border border-border shadow-xl z-50">
          <button
            onClick={handleGoogle}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-background-tertiary transition-colors flex items-center gap-3"
          >
            <GoogleCalIcon className="w-4 h-4" />
            Google Calendar
          </button>
          <button
            onClick={handleICS}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-background-tertiary transition-colors flex items-center gap-3"
          >
            <CalendarPlus className="w-4 h-4 text-foreground-muted" />
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
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
