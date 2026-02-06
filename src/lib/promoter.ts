import { createClient } from '@/lib/supabase-browser'

// ============================================
// TYPES
// ============================================

export interface PromotionClaim {
  id: string
  user_id: string
  user_email: string
  promotion_id: string
  contact_name: string
  role_title: string | null
  proof_description: string | null
  website_or_social: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined
  promotions?: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

export interface EventMatch {
  id: string
  event_id: string
  match_title: string | null
  match_type: string | null
  match_stipulation: string | null
  match_order: number | null
  is_title_match: boolean
  championship_name: string | null
  result_summary: string | null
  match_rating: number | null
  created_at: string
  // Joined
  match_participants?: MatchParticipant[]
}

export interface MatchParticipant {
  id: string
  match_id: string
  wrestler_id: string
  team_number: number
  is_winner: boolean
  entrance_order: number | null
  // Joined
  wrestlers?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
  }
}

export interface StreamingLink {
  id: string
  event_id: string
  platform: string
  url: string
  label: string | null
  is_live: boolean
  created_at: string
}

export interface AnnouncedTalent {
  id: string
  event_id: string
  wrestler_id: string
  announcement_note: string | null
  sort_order: number
  // Joined
  wrestlers?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
    hometown: string | null
  }
}

export interface PromoterDashboardData {
  promotion: any
  upcomingEvents: any[]
  pastEvents: any[]
  followerCount: number
  totalAttending: number
}

// ============================================
// CLAIM FUNCTIONS
// ============================================

export async function submitPromotionClaim(data: {
  promotion_id: string
  contact_name: string
  role_title?: string
  proof_description?: string
  website_or_social?: string
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in')

  const { data: claim, error } = await supabase
    .from('promotion_claims')
    .insert({
      user_id: user.id,
      user_email: user.email,
      promotion_id: data.promotion_id,
      contact_name: data.contact_name,
      role_title: data.role_title || null,
      proof_description: data.proof_description || null,
      website_or_social: data.website_or_social || null,
    })
    .select()
    .single()

  if (error) throw error
  return claim as PromotionClaim
}

export async function getUserClaims() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('promotion_claims')
    .select(`
      *,
      promotions (
        id, name, slug, logo_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching claims:', error)
    return []
  }
  return data as PromotionClaim[]
}

export async function getExistingClaim(promotionId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('promotion_claims')
    .select('*')
    .eq('user_id', user.id)
    .eq('promotion_id', promotionId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (error) {
    console.error('Error checking claim:', error)
    return null
  }
  return data as PromotionClaim | null
}

// ============================================
// PROMOTER DASHBOARD FUNCTIONS
// ============================================

export async function getPromoterPromotion() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('claimed_by', user.id)
    .single()

  if (error) {
    console.error('Error fetching promoter promotion:', error)
    return null
  }
  return data
}

export async function getPromoterDashboardData(): Promise<PromoterDashboardData | null> {
  const supabase = createClient()
  
  const promotion = await getPromoterPromotion()
  if (!promotion) return null

  const today = new Date().toISOString().split('T')[0]

  // Fetch upcoming events
  const { data: upcoming } = await supabase
    .from('events')
    .select('*')
    .eq('promotion_id', promotion.id)
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  // Fetch past events (last 20)
  const { data: past } = await supabase
    .from('events')
    .select('*')
    .eq('promotion_id', promotion.id)
    .lt('event_date', today)
    .order('event_date', { ascending: false })
    .limit(20)

  // Follower count
  const { count: followerCount } = await supabase
    .from('user_follows_promotion')
    .select('*', { count: 'exact', head: true })
    .eq('promotion_id', promotion.id)

  // Total attending across upcoming events
  const { count: totalAttending } = await supabase
    .from('user_event_attendance')
    .select('*, events!inner(*)', { count: 'exact', head: true })
    .eq('events.promotion_id', promotion.id)
    .gte('events.event_date', today)
    .eq('status', 'attending')

  return {
    promotion,
    upcomingEvents: upcoming || [],
    pastEvents: past || [],
    followerCount: followerCount || 0,
    totalAttending: totalAttending || 0,
  }
}

// ============================================
// EVENT MANAGEMENT FUNCTIONS
// ============================================

export async function updateEvent(eventId: string, updates: {
  ticket_url?: string | null
  streaming_url?: string | null
  ticket_price_min?: number | null
  ticket_price_max?: number | null
  is_free?: boolean
  is_sold_out?: boolean
  description?: string | null
  event_time?: string | null
  doors_time?: string | null
  poster_url?: string | null
  venue_address?: string | null
  venue_name?: string | null
  city?: string | null
  state?: string | null
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEventForEditing(eventId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      promotions (
        id, name, slug, claimed_by
      )
    `)
    .eq('id', eventId)
    .single()

  if (error) throw error
  return data
}

// ============================================
// MATCH MANAGEMENT FUNCTIONS
// ============================================

export async function getEventMatches(eventId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_matches')
    .select(`
      *,
      match_participants (
        *,
        wrestlers (
          id, name, slug, photo_url
        )
      )
    `)
    .eq('event_id', eventId)
    .order('match_order', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching matches:', error)
    return []
  }
  return data as EventMatch[]
}

export async function createMatch(data: {
  event_id: string
  match_title?: string
  match_type?: string
  match_stipulation?: string
  match_order?: number
  is_title_match?: boolean
  championship_name?: string
}) {
  const supabase = createClient()

  const { data: match, error } = await supabase
    .from('event_matches')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return match as EventMatch
}

export async function updateMatch(matchId: string, updates: Partial<EventMatch>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMatch(matchId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_matches')
    .delete()
    .eq('id', matchId)

  if (error) throw error
}

export async function addMatchParticipant(data: {
  match_id: string
  wrestler_id: string
  team_number?: number
}) {
  const supabase = createClient()

  const { data: participant, error } = await supabase
    .from('match_participants')
    .insert(data)
    .select(`
      *,
      wrestlers (id, name, slug, photo_url)
    `)
    .single()

  if (error) throw error
  return participant
}

export async function removeMatchParticipant(participantId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('match_participants')
    .delete()
    .eq('id', participantId)

  if (error) throw error
}

// ============================================
// PROMOTION PROFILE MANAGEMENT
// ============================================

export async function updatePromotion(promotionId: string, updates: {
  description?: string | null
  website?: string | null
  twitter_handle?: string | null
  instagram_handle?: string | null
  facebook_url?: string | null
  youtube_url?: string | null
  logo_url?: string | null
  banner_url?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  booking_email?: string | null
  merch_url?: string | null
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', promotionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// WRESTLER SEARCH (for adding to matches)
// ============================================

export async function searchWrestlers(query: string, limit = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('wrestlers')
    .select('id, name, slug, photo_url, hometown')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching wrestlers:', error)
    return []
  }
  return data
}

// ============================================
// POSTER UPLOAD
// ============================================

export async function uploadEventPoster(eventId: string, file: File) {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const filePath = `event-posters/${eventId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('posters')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('posters')
    .getPublicUrl(filePath)

  // Update event with poster URL
  await updateEvent(eventId, { poster_url: publicUrl })

  return publicUrl
}

// ============================================
// STREAMING LINKS
// ============================================

export async function getStreamingLinks(eventId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_streaming_links')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching streaming links:', error)
    return []
  }
  return data as StreamingLink[]
}

export async function addStreamingLink(data: {
  event_id: string
  platform: string
  url: string
  label?: string
  is_live?: boolean
}) {
  const supabase = createClient()

  const { data: link, error } = await supabase
    .from('event_streaming_links')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return link as StreamingLink
}

export async function updateStreamingLink(linkId: string, updates: {
  platform?: string
  url?: string
  label?: string | null
  is_live?: boolean
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_streaming_links')
    .update(updates)
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data as StreamingLink
}

export async function deleteStreamingLink(linkId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_streaming_links')
    .delete()
    .eq('id', linkId)

  if (error) throw error
}

// ============================================
// ANNOUNCED TALENT
// ============================================

export async function getAnnouncedTalent(eventId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_announced_talent')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url, hometown)
    `)
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching announced talent:', error)
    return []
  }
  return data as AnnouncedTalent[]
}

export async function addAnnouncedTalent(data: {
  event_id: string
  wrestler_id: string
  announcement_note?: string
  sort_order?: number
}) {
  const supabase = createClient()

  const { data: talent, error } = await supabase
    .from('event_announced_talent')
    .insert(data)
    .select(`
      *,
      wrestlers (id, name, slug, photo_url, hometown)
    `)
    .single()

  if (error) throw error
  return talent as AnnouncedTalent
}

export async function updateAnnouncedTalent(talentId: string, updates: {
  announcement_note?: string | null
  sort_order?: number
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_announced_talent')
    .update(updates)
    .eq('id', talentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeAnnouncedTalent(talentId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_announced_talent')
    .delete()
    .eq('id', talentId)

  if (error) throw error
}

// ============================================
// EVENT CRUD (Create / Delete)
// ============================================

export async function createEvent(data: {
  name: string
  event_date: string
  promotion_id: string
  venue_name?: string
  venue_address?: string
  city?: string
  state?: string
  country?: string
  event_time?: string
  doors_time?: string
  description?: string
  ticket_url?: string
  is_free?: boolean
}) {
  const supabase = createClient()

  // Generate a slug from the name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...data,
      slug,
      status: 'upcoming',
      country: data.country || 'USA',
    })
    .select()
    .single()

  if (error) throw error
  return event
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

// ============================================
// CHAMPIONSHIPS
// ============================================

export interface Championship {
  id: string
  promotion_id: string
  name: string
  short_name: string | null
  current_champion_id: string | null
  current_champion_2_id: string | null
  is_active: boolean
  sort_order: number
  image_url: string | null
  won_date: string | null
  created_at: string
  // Joined
  current_champion?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
  } | null
  current_champion_2?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
  } | null
}

export async function getPromotionChampionships(promotionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promotion_championships')
    .select(`
      *,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
    `)
    .eq('promotion_id', promotionId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching championships:', error)
    return []
  }
  return data as Championship[]
}

export async function createChampionship(data: {
  promotion_id: string
  name: string
  short_name?: string
  sort_order?: number
}) {
  const supabase = createClient()

  const { data: championship, error } = await supabase
    .from('promotion_championships')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return championship
}

export async function updateChampionship(championshipId: string, updates: {
  name?: string
  short_name?: string | null
  current_champion_id?: string | null
  current_champion_2_id?: string | null
  is_active?: boolean
  sort_order?: number
  image_url?: string | null
  won_date?: string | null
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promotion_championships')
    .update(updates)
    .eq('id', championshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChampionship(championshipId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('promotion_championships')
    .delete()
    .eq('id', championshipId)

  if (error) throw error
}

// ============================================
// ROSTER MANAGEMENT
// ============================================

export interface RosterMember {
  id: string
  wrestler_id: string
  promotion_id: string
  is_active: boolean
  is_exclusive: boolean
  started_at: string | null
  wrestlers?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
    hometown: string | null
  }
}

export async function getPromotionRoster(promotionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('wrestler_promotions')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url, hometown)
    `)
    .eq('promotion_id', promotionId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching roster:', error)
    return []
  }
  return data as RosterMember[]
}

export async function addToRoster(data: {
  promotion_id: string
  wrestler_id: string
  is_exclusive?: boolean
}) {
  const supabase = createClient()

  const { data: member, error } = await supabase
    .from('wrestler_promotions')
    .insert({
      ...data,
      is_active: true,
      started_at: new Date().toISOString().split('T')[0],
    })
    .select(`
      *,
      wrestlers (id, name, slug, photo_url, hometown)
    `)
    .single()

  if (error) throw error
  return member as RosterMember
}

export async function removeFromRoster(memberId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('wrestler_promotions')
    .update({ is_active: false, ended_at: new Date().toISOString().split('T')[0] })
    .eq('id', memberId)

  if (error) throw error
}
