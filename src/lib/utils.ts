import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns'

/**
 * Returns today's date as YYYY-MM-DD in Hawaii time (HST, UTC-10).
 * Events stay "upcoming" until midnight Hawaii time — the latest US timezone.
 */
export function getTodayHawaii(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' })
}

// Classname utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  
  if (isToday(date)) {
    return 'Today'
  }
  if (isTomorrow(date)) {
    return 'Tomorrow'
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE') // "Saturday"
  }
  
  return format(date, 'MMM d') // "Feb 15"
}

export function formatEventDateFull(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return format(date, 'EEEE, MMMM d, yyyy') // "Saturday, February 15, 2025"
}

export function formatEventTime(timeString: string | null): string {
  if (!timeString) return ''
  
  // Parse time string (HH:MM:SS)
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  
  return format(date, 'h:mm a') // "7:00 PM"
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  return formatDistanceToNow(date, { addSuffix: true })
}

// Location formatting
export function formatLocation(city: string | null, state: string | null): string {
  if (!city && !state) return 'TBA'
  if (!state) return city || 'TBA'
  if (!city) return state
  return `${city}, ${state}`
}

// Price formatting
export function formatPrice(min: number | null, max: number | null, isFree: boolean): string {
  if (isFree) return 'Free'
  if (!min && !max) return 'TBA'
  if (min && max && min !== max) {
    return `$${min} - $${max}`
  }
  return `$${min || max}`
}

// URL helpers
export function getTwitterUrl(handle: string | null): string | null {
  if (!handle) return null
  const cleanHandle = handle.replace('@', '')
  return `https://twitter.com/${cleanHandle}`
}

export function getInstagramUrl(handle: string | null): string | null {
  if (!handle) return null
  const cleanHandle = handle.replace('@', '')
  return `https://instagram.com/${cleanHandle}`
}

// Slug helpers
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Attendance formatting
export function formatAttendance(attending: number, interested: number): string {
  const total = attending + interested
  if (total === 0) return 'Be the first!'
  if (attending === 0) return `${interested} interested`
  if (interested === 0) return `${attending} attending`
  return `${attending} attending · ${interested} interested`
}

// Relative time formatting (e.g., "2h ago", "Yesterday", "3 days ago")
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Number formatting
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
