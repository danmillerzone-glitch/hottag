import { createClient } from '@/lib/supabase-browser'

// ============================================
// ADMIN CHECK
// ============================================

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  return !!data && !error
}

// ============================================
// CLAIMS MANAGEMENT
// ============================================

export async function getPendingPromotionClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotion_claims')
    .select(`
      *,
      promotions (id, name, slug, logo_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('Error fetching promotion claims:', error); return [] }
  return data || []
}

export async function getAllPromotionClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotion_claims')
    .select(`
      *,
      promotions (id, name, slug, logo_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error('Error fetching promotion claims:', error); return [] }
  return data || []
}

export async function getPendingWrestlerClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wrestler_claims')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('Error fetching wrestler claims:', error); return [] }
  return data || []
}

export async function getAllWrestlerClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wrestler_claims')
    .select(`
      *,
      wrestlers (id, name, slug, photo_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error('Error fetching wrestler claims:', error); return [] }
  return data || []
}

export async function approvePromotionClaim(claimId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Call the stored function
  const { data, error } = await supabase.rpc('approve_promotion_claim', { claim_id: claimId })
  if (error) throw error
  return data
}

export async function rejectPromotionClaim(claimId: string, notes?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('promotion_claims')
    .update({
      status: 'rejected',
      admin_notes: notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', claimId)

  if (error) throw error
}

export async function approveWrestlerClaim(claimId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('approve_wrestler_claim', { claim_id: claimId })
  if (error) throw error
  return data
}

export async function rejectWrestlerClaim(claimId: string, notes?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('wrestler_claims')
    .update({
      status: 'rejected',
      admin_notes: notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', claimId)

  if (error) throw error
}

// ============================================
// STATS
// ============================================

export async function getAdminStats() {
  const supabase = createClient()

  const [
    { count: totalEvents },
    { count: totalPromotions },
    { count: totalWrestlers },
    { count: pendingPromoClaims },
    { count: pendingWrestlerClaims },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('promotions').select('*', { count: 'exact', head: true }),
    supabase.from('wrestlers').select('*', { count: 'exact', head: true }),
    supabase.from('promotion_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('wrestler_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('admin_users').select('*', { count: 'exact', head: true }), // Placeholder - can't count auth.users from client
  ])

  return {
    totalEvents: totalEvents || 0,
    totalPromotions: totalPromotions || 0,
    totalWrestlers: totalWrestlers || 0,
    pendingPromoClaims: pendingPromoClaims || 0,
    pendingWrestlerClaims: pendingWrestlerClaims || 0,
    totalUsers: totalUsers || 0,
  }
}

// ============================================
// SEARCH / MANAGE
// ============================================

export async function searchEvents(query: string, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, name, slug, event_date, status, city, state,
      promotions (id, name, slug)
    `)
    .ilike('name', `%${query}%`)
    .order('event_date', { ascending: false })
    .limit(limit)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function searchPromotions(query: string, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('id, name, slug, city, state, claimed_by, verification_status')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function searchWrestlersAdmin(query: string, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wrestlers')
    .select('id, name, slug, photo_url, claimed_by, verification_status, pwi_ranking')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) throw error
}

export async function deleteWrestler(wrestlerId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('wrestlers').delete().eq('id', wrestlerId)
  if (error) throw error
}

export async function updateEventStatus(eventId: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId)
  if (error) throw error
}
