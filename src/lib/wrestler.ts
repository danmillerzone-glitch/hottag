import { createClient } from '@/lib/supabase-browser'

// ============================================
// TYPES
// ============================================

export interface WrestlerClaim {
  id: string
  user_id: string
  user_email: string
  wrestler_id: string
  contact_name: string
  ring_name: string | null
  proof_description: string | null
  website_or_social: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  wrestlers?: {
    id: string
    name: string
    slug: string
    photo_url: string | null
  }
}

export interface WrestlerDashboardData {
  wrestler: any
  followerCount: number
  upcomingEvents: any[]
  championships: any[]
}

// ============================================
// CLAIMS
// ============================================

export async function submitWrestlerClaim(data: {
  wrestler_id: string
  contact_name: string
  ring_name?: string
  proof_description?: string
  website_or_social?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: claim, error } = await supabase
    .from('wrestler_claims')
    .insert({
      user_id: user.id,
      user_email: user.email!,
      wrestler_id: data.wrestler_id,
      contact_name: data.contact_name,
      ring_name: data.ring_name || null,
      proof_description: data.proof_description || null,
      website_or_social: data.website_or_social || null,
    })
    .select()
    .single()

  if (error) throw error
  return claim as WrestlerClaim
}

export async function getUserWrestlerClaims() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('wrestler_claims')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wrestler claims:', error)
    return []
  }
  return data as WrestlerClaim[]
}

export async function getExistingWrestlerClaim(wrestlerId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('wrestler_claims')
    .select('*')
    .eq('user_id', user.id)
    .eq('wrestler_id', wrestlerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking wrestler claim:', error)
    return null
  }
  return data as WrestlerClaim | null
}

// ============================================
// WRESTLER DASHBOARD
// ============================================

export async function getClaimedWrestler() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching claimed wrestler:', error)
    return null
  }
  return data
}

export async function getWrestlerDashboardData(): Promise<WrestlerDashboardData | null> {
  const supabase = createClient()
  const wrestler = await getClaimedWrestler()
  if (!wrestler) return null

  // Get follower count
  const { count: followerCount } = await supabase
    .from('user_follows_wrestler')
    .select('*', { count: 'exact', head: true })
    .eq('wrestler_id', wrestler.id)

  // Get upcoming events from all sources
  const today = new Date().toISOString().split('T')[0]
  
  const { data: ewData } = await supabase
    .from('event_wrestlers')
    .select(`events (id, name, slug, event_date, city, state, promotions (name, slug))`)
    .eq('wrestler_id', wrestler.id)

  const { data: mpData } = await supabase
    .from('match_participants')
    .select(`event_matches ( events (id, name, slug, event_date, city, state, promotions (name, slug)) )`)
    .eq('wrestler_id', wrestler.id)

  const { data: atData } = await supabase
    .from('event_announced_talent')
    .select(`events (id, name, slug, event_date, city, state, promotions (name, slug))`)
    .eq('wrestler_id', wrestler.id)

  const eventMap = new Map<string, any>()
  for (const d of (ewData || [])) {
    if ((d as any).events) eventMap.set((d as any).events.id, (d as any).events)
  }
  for (const d of (mpData || [])) {
    const event = (d as any).event_matches?.events
    if (event) eventMap.set(event.id, event)
  }
  for (const d of (atData || [])) {
    if ((d as any).events) eventMap.set((d as any).events.id, (d as any).events)
  }

  const upcomingEvents = Array.from(eventMap.values())
    .filter((e: any) => e.event_date >= today)
    .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date))

  // Get championships
  const { data: champsAs1 } = await supabase
    .from('promotion_championships')
    .select(`
      id, name, short_name, won_date,
      promotions (name, slug)
    `)
    .eq('current_champion_id', wrestler.id)
    .eq('is_active', true)

  const { data: champsAs2 } = await supabase
    .from('promotion_championships')
    .select(`
      id, name, short_name, won_date,
      promotions (name, slug)
    `)
    .eq('current_champion_2_id', wrestler.id)
    .eq('is_active', true)

  const championships = [...(champsAs1 || []), ...(champsAs2 || [])]

  return {
    wrestler,
    followerCount: followerCount || 0,
    upcomingEvents,
    championships,
  }
}

// ============================================
// UPDATE WRESTLER PROFILE
// ============================================

export async function updateWrestlerProfile(wrestlerId: string, updates: {
  bio?: string | null
  hometown?: string | null
  moniker?: string | null
  birthplace?: string | null
  residence?: string | null
  height?: string | null
  weight?: string | null
  birthday?: string | null
  debut_year?: number | null
  trainer?: string | null
  twitter_handle?: string | null
  instagram_handle?: string | null
  tiktok_handle?: string | null
  youtube_url?: string | null
  website?: string | null
  booking_email?: string | null
  merch_url?: string | null
  photo_url?: string | null
  render_url?: string | null
  countries_wrestled?: string[]
  signature_moves?: string[] | null
  bluesky_handle?: string | null
  patreon_url?: string | null
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use claimed_by filter to satisfy RLS policy
  const { data, error } = await supabase
    .from('wrestlers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', wrestlerId)
    .eq('claimed_by', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating wrestler profile:', error)
    throw error
  }
  return data
}

export async function uploadWrestlerPhoto(wrestlerId: string, file: File) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `${wrestlerId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('wrestler-photos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('wrestler-photos')
    .getPublicUrl(filePath)

  // Update wrestler record with new photo URL (add cache-busting param)
  const urlWithBust = `${publicUrl}?v=${Date.now()}`
  const updated = await updateWrestlerProfile(wrestlerId, { photo_url: urlWithBust })
  return updated
}

export async function uploadWrestlerRender(wrestlerId: string, file: File) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `${wrestlerId}-render.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('wrestler-photos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('wrestler-photos')
    .getPublicUrl(filePath)

  const urlWithBust = `${publicUrl}?v=${Date.now()}`
  const updated = await updateWrestlerProfile(wrestlerId, { render_url: urlWithBust })
  return updated
}

export async function redeemWrestlerClaimCode(code: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('redeem_wrestler_claim_code', { code })
  if (error) throw error
  return data as { success: boolean; error?: string; wrestler_id?: string; wrestler_name?: string }
}
