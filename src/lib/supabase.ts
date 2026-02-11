import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Promotion {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  facebook_url: string | null
  youtube_url: string | null
  booking_email: string | null
  merch_url: string | null
  bluesky_handle: string | null
  patreon_url: string | null
  city: string | null
  state: string | null
  country: string
  region: string | null
  verification_status: 'unverified' | 'pending' | 'verified'
  featured_video_url: string | null
  featured_video_title: string | null
  video_section_title: string | null
  created_at: string
}

export interface Wrestler {
  id: string
  name: string
  slug: string
  moniker: string | null
  bio: string | null
  hometown: string | null
  birthplace: string | null
  residence: string | null
  height: string | null
  weight: string | null
  birthday: string | null
  debut_year: number | null
  trainer: string | null
  photo_url: string | null
  render_url: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_url: string | null
  website: string | null
  booking_email: string | null
  merch_url: string | null
  bluesky_handle: string | null
  patreon_url: string | null
  countries_wrestled: string[] | null
  pwi_ranking: number | null
  hero_style: { type: string; value: string; accent?: string } | null
  featured_video_url: string | null
  featured_video_title: string | null
  video_section_title: string | null
  verification_status: 'unverified' | 'pending' | 'verified'
  follower_count: number
  upcoming_events_count: number
  created_at: string
}

export const PROFESSIONAL_ROLES = [
  'referee', 'photographer', 'videographer', 'graphic_designer',
  'ring_announcer', 'commentator', 'manager_valet', 'producer',
  'trainer', 'dj_music', 'ring_crew', 'other'
] as const

export const ROLE_LABELS: Record<string, string> = {
  referee: 'Referee',
  photographer: 'Photographer',
  videographer: 'Videographer',
  graphic_designer: 'Graphic Designer',
  ring_announcer: 'Ring Announcer',
  commentator: 'Commentator',
  manager_valet: 'Manager / Valet',
  producer: 'Producer',
  trainer: 'Trainer',
  dj_music: 'DJ / Music',
  ring_crew: 'Ring Crew',
  other: 'Other',
}

export interface Professional {
  id: string
  name: string
  slug: string
  role: string[]
  moniker: string | null
  bio: string | null
  hometown: string | null
  residence: string | null
  photo_url: string | null
  website: string | null
  booking_email: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_url: string | null
  facebook_url: string | null
  bluesky_handle: string | null
  patreon_url: string | null
  video_section_title: string | null
  claimed_by: string | null
  claim_code: string | null
  verification_status: 'unverified' | 'pending' | 'verified'
  follower_count: number
  linked_wrestler_id: string | null
  created_at: string
}

export function formatRoles(roles: string | string[]): string {
  const arr = Array.isArray(roles) ? roles : [roles]
  return arr.map(r => ROLE_LABELS[r] || r).join(' / ')
}

export interface Event {
  id: string
  name: string
  slug: string | null
  description: string | null
  event_date: string
  event_time: string | null
  doors_time: string | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  is_featured: boolean
  promotion_id: string | null
  venue_id: string | null
  venue_name: string | null
  venue_address: string | null
  city: string | null
  state: string | null
  country: string
  latitude: number | null
  longitude: number | null
  ticket_url: string | null
  ticket_price_min: number | null
  ticket_price_max: number | null
  is_free: boolean
  is_sold_out: boolean
  poster_url: string | null
  attending_count: number
  interested_count: number
  streaming_url: string | null
  coupon_code: string | null
  coupon_label: string | null
  created_at: string
  // Joined fields
  promotion?: Promotion
}

export interface EventWithPromotion extends Event {
  promotions: Promotion | null
}

// API Functions
export async function getUpcomingEvents(limit = 20, offset = 0) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('events_with_counts')
    .select(`
      *,
      promotions (
        id,
        name,
        slug,
        logo_url,
        twitter_handle
      )
    `)
    .eq('status', 'upcoming')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  // Map real counts to the expected field names
  return data.map((e: any) => ({
    ...e,
    attending_count: e.real_attending_count || 0,
    interested_count: e.real_interested_count || 0
  })) as EventWithPromotion[]
}

export async function getEventsByLocation(
  latitude: number,
  longitude: number,
  radiusMiles: number = 100,
  limit: number = 50
) {
  // For now, we'll fetch all upcoming events and filter client-side
  // In production, you'd use PostGIS for this
  const events = await getUpcomingEvents(500)
  
  // Calculate distance for each event
  const eventsWithDistance = events
    .filter(e => e.latitude && e.longitude)
    .map(event => ({
      ...event,
      distance: calculateDistance(
        latitude,
        longitude,
        event.latitude!,
        event.longitude!
      )
    }))
    .filter(e => e.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)

  return eventsWithDistance
}

export async function getEvent(idOrSlug: string) {
  const { data, error } = await supabase
    .from('events_with_counts')
    .select(`
      *,
      promotions (
        id,
        name,
        slug,
        logo_url,
        website,
        twitter_handle,
        instagram_handle,
        tiktok_handle,
        facebook_url,
        youtube_url,
        booking_email,
        merch_url
      )
    `)
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  // Map real counts
  return {
    ...data,
    attending_count: data.real_attending_count || 0,
    interested_count: data.real_interested_count || 0
  } as EventWithPromotion
}

export async function getEventWrestlers(eventId: string) {
  const { data, error } = await supabase
    .from('event_wrestlers')
    .select(`
      match_order,
      wrestlers (
        id,
        name,
        slug,
        photo_url,
        hometown
      )
    `)
    .eq('event_id', eventId)
    .order('match_order', { ascending: true })

  if (error) {
    console.error('Error fetching event wrestlers:', error)
    return []
  }

  const wrestlers = data
    .map((d: any) => d.wrestlers)
    .filter(Boolean)
  
  return wrestlers
}

export async function getPromotions(limit = 50) {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('name')
    .limit(limit)

  if (error) {
    console.error('Error fetching promotions:', error)
    return []
  }

  return data as Promotion[]
}

export async function getPromotion(slug: string) {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching promotion:', error)
    return null
  }

  return data as Promotion
}

export async function getPromotionEvents(promotionId: string, limit = 20) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('promotion_id', promotionId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching promotion events:', error)
    return []
  }

  return data as Event[]
}

export async function getWrestlers(limit = 50) {
  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .order('follower_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching wrestlers:', error)
    return []
  }

  return data as Wrestler[]
}

export async function getWrestler(slug: string) {
  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching wrestler:', error)
    return null
  }

  return data as Wrestler
}

export async function searchEvents(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      promotions (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
    .eq('status', 'upcoming')
    .order('event_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error searching events:', error)
    return []
  }

  return data as EventWithPromotion[]
}

// Utility function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
