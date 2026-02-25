const STORAGE_KEY = 'hottag_recently_viewed'
const MAX_ITEMS = 12

export interface RecentItem {
  type: 'event' | 'wrestler' | 'promotion'
  id: string
  name: string
  slug?: string
  image?: string | null
  subtitle?: string  // e.g. promotion name, location, style
  viewedAt: number
}

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentItem[]
  } catch {
    return []
  }
}

export function addRecentlyViewed(item: Omit<RecentItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentlyViewed()
    // Remove duplicate if exists
    const filtered = existing.filter(
      (i) => !(i.type === item.type && i.id === item.id)
    )
    // Add to front
    const updated: RecentItem[] = [
      { ...item, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}
