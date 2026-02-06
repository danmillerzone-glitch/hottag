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

  // Get upcoming events
  const today = new Date().toISOString().split('T')[0]
  const { data: eventLinks } = await supabase
    .from('event_wrestlers')
    .select(`
      events (
        id, name, slug, event_date, city, state,
        promotions (name, slug)
      )
    `)
    .eq('wrestler_id', wrestler.id)

  const upcomingEvents = (eventLinks || [])
    .map((e: any) => e.events)
    .filter((e: any) => e && e.event_date >= today)
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
  twitter_handle?: string | null
  instagram_handle?: string | null
  tiktok_handle?: string | null
  youtube_url?: string | null
  website?: string | null
  booking_email?: string | null
  merch_url?: string | null
  photo_url?: string | null
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('wrestlers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', wrestlerId)
    .select()
    .single()

  if (error) throw error
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

  // Update wrestler record with new photo URL
  const updated = await updateWrestlerProfile(wrestlerId, { photo_url: publicUrl })
  return updated
}
