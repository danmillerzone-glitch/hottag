import { createClient } from '@/lib/supabase-browser'

// ============================================
// ADMIN API HELPER (uses service role key via API route)
// ============================================

async function adminApi(body: { action: string; table: string; id?: string; data?: any; filter?: any }) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Admin operation failed')
  return json
}

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
    .select('id, name, slug, city, state, claimed_by, verification_status, claim_code, onboarding_featured')
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
    .select('id, name, slug, photo_url, claimed_by, verification_status, pwi_ranking, claim_code')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function deleteEvent(eventId: string) {
  await adminApi({ action: 'delete', table: 'events', id: eventId })
}

export async function deleteWrestler(wrestlerId: string) {
  await adminApi({ action: 'delete', table: 'wrestlers', id: wrestlerId })
}

export async function deletePromotion(promotionId: string) {
  await adminApi({ action: 'delete', table: 'promotions', id: promotionId })
}

export async function getPromotionChampionshipsAdmin(promotionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotion_championships')
    .select(`
      *,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
    `)
    .eq('promotion_id', promotionId)
    .order('name')
  if (error) { console.error(error); return [] }
  return data || []
}

export async function deleteChampionshipAdmin(championshipId: string) {
  await adminApi({ action: 'delete', table: 'promotion_championships', id: championshipId })
}

export async function createChampionshipAdmin(data: {
  promotion_id: string
  name: string
  short_name?: string
  is_tag_team?: boolean
  sort_order?: number
}) {
  const supabase = createClient()
  // Try with is_tag_team first, fall back without it if column doesn't exist
  const insertData: any = { promotion_id: data.promotion_id, name: data.name }
  if (data.short_name) insertData.short_name = data.short_name
  if (data.sort_order !== undefined) insertData.sort_order = data.sort_order
  if (data.is_tag_team !== undefined) insertData.is_tag_team = data.is_tag_team

  let { data: championship, error } = await supabase
    .from('promotion_championships')
    .insert(insertData)
    .select(`
      *,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
    `)
    .single()

  // If is_tag_team column doesn't exist, retry without it
  if (error && error.message?.includes('is_tag_team')) {
    delete insertData.is_tag_team
    const retry = await supabase
      .from('promotion_championships')
      .insert(insertData)
      .select(`
        *,
        current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
        current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
      `)
      .single()
    if (retry.error) throw retry.error
    return retry.data
  }

  if (error) throw error
  return championship
}

export async function updateChampionshipAdmin(championshipId: string, updates: {
  name?: string
  short_name?: string | null
  current_champion_id?: string | null
  current_champion_2_id?: string | null
  is_tag_team?: boolean
  is_active?: boolean
  sort_order?: number
  won_date?: string | null
}) {
  const supabase = createClient()
  const cleanUpdates = { ...updates }

  let { data, error } = await supabase
    .from('promotion_championships')
    .update(cleanUpdates)
    .eq('id', championshipId)
    .select(`
      *,
      current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
      current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
    `)
    .single()

  // If is_tag_team column doesn't exist, retry without it
  if (error && error.message?.includes('is_tag_team')) {
    delete cleanUpdates.is_tag_team
    const retry = await supabase
      .from('promotion_championships')
      .update(cleanUpdates)
      .eq('id', championshipId)
      .select(`
        *,
        current_champion:wrestlers!promotion_championships_current_champion_id_fkey (id, name, slug, photo_url),
        current_champion_2:wrestlers!promotion_championships_current_champion_2_id_fkey (id, name, slug, photo_url)
      `)
      .single()
    if (retry.error) throw retry.error
    return retry.data
  }

  if (error) throw error
  return data
}

// ============================================
// ROSTER MANAGEMENT (ADMIN)
// ============================================

export async function getPromotionRosterAdmin(promotionId: string) {
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
  if (error) { console.error(error); return [] }
  return data || []
}

export async function addToRosterAdmin(promotionId: string, wrestlerId: string) {
  const supabase = createClient()

  // Check if inactive record exists
  const { data: existing } = await supabase
    .from('wrestler_promotions')
    .select('id')
    .eq('promotion_id', promotionId)
    .eq('wrestler_id', wrestlerId)
    .maybeSingle()

  if (existing) {
    const { data: member, error } = await supabase
      .from('wrestler_promotions')
      .update({ is_active: true })
      .eq('id', existing.id)
      .select(`*, wrestlers (id, name, slug, photo_url, hometown)`)
      .single()
    if (error) throw error
    return member
  }

  const { data: member, error } = await supabase
    .from('wrestler_promotions')
    .insert({ promotion_id: promotionId, wrestler_id: wrestlerId, is_active: true })
    .select(`*, wrestlers (id, name, slug, photo_url, hometown)`)
    .single()
  if (error) throw error
  return member
}

export async function removeFromRosterAdmin(memberId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('wrestler_promotions')
    .update({ is_active: false })
    .eq('id', memberId)
  if (error) throw error
}

export async function updateEventStatus(eventId: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId)
  if (error) throw error
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export async function getAnnouncements() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function getActiveAnnouncements() {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .eq('is_active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .lte('starts_at', now)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function createAnnouncement(announcement: {
  message: string
  type?: string
  link_url?: string
  link_text?: string
  ends_at?: string | null
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('site_announcements')
    .insert({
      ...announcement,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('site_announcements')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  await adminApi({ action: 'delete', table: 'site_announcements', id })
}

// ============================================
// HOMEPAGE NEWS FEED
// ============================================

export async function getHomepageNews() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('homepage_news')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function getActiveHomepageNews() {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('homepage_news')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) { console.error(error); return [] }
  return data || []
}

export async function createHomepageNewsItem(item: {
  type: string
  title: string
  body?: string
  image_url?: string
  link_url?: string
  related_wrestler_id?: string
  related_promotion_id?: string
  related_event_id?: string
  related_championship_id?: string
  expires_at?: string | null
  size?: string
  sort_order?: number
  display_date?: string | null
}) {
  const result = await adminApi({
    action: 'insert',
    table: 'homepage_news',
    data: { ...item, is_auto: false },
  })
  return result.data
}

export async function updateHomepageNewsItem(id: string, updates: {
  title?: string
  body?: string | null
  type?: string
  image_url?: string | null
  link_url?: string | null
  expires_at?: string | null
  size?: string
  sort_order?: number
  display_date?: string | null
}) {
  await adminApi({ action: 'update', table: 'homepage_news', id, data: updates })
}

export async function toggleHomepageNewsItem(id: string, isActive: boolean) {
  await adminApi({ action: 'update', table: 'homepage_news', id, data: { is_active: isActive } })
}

export async function deleteHomepageNewsItem(id: string) {
  await adminApi({ action: 'delete', table: 'homepage_news', id })
}

// ============================================
// USER MANAGEMENT & BANS
// ============================================

export async function banUser(userId: string, reason: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('banned_users')
    .insert({ user_id: userId, reason, banned_by: user.id })
  if (error) throw error
}

export async function unbanUser(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('banned_users')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}

export async function getBannedUsers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('banned_users')
    .select('*')
    .order('banned_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data || []
}

// ============================================
// DIRECT EDITING
// ============================================

export async function updateWrestlerAdmin(wrestlerId: string, updates: Record<string, any>) {
  const supabase = createClient()
  const { error } = await supabase.from('wrestlers').update(updates).eq('id', wrestlerId)
  if (error) throw error
}

export async function updatePromotionAdmin(promotionId: string, updates: Record<string, any>) {
  const supabase = createClient()
  const { error } = await supabase.from('promotions').update(updates).eq('id', promotionId)
  if (error) throw error
}

export async function updateEventAdmin(eventId: string, updates: Record<string, any>) {
  const supabase = createClient()
  const { error } = await supabase.from('events').update(updates).eq('id', eventId)
  if (error) throw error
}

export async function getWrestlerFull(wrestlerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wrestlers')
    .select('*')
    .eq('id', wrestlerId)
    .single()
  if (error) throw error
  return data
}

export async function getPromotionFull(promotionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .single()
  if (error) throw error
  return data
}

export async function getEventFull(eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, promotions(id, name, slug)')
    .eq('id', eventId)
    .single()
  if (error) throw error
  return data
}

// ============================================
// MANUAL VERIFICATION
// ============================================

export async function verifyWrestler(wrestlerId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('wrestlers')
    .update({ verification_status: 'verified' })
    .eq('id', wrestlerId)
  if (error) throw error
}

export async function unverifyWrestler(wrestlerId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('wrestlers')
    .update({ verification_status: 'unverified' })
    .eq('id', wrestlerId)
  if (error) throw error
}

export async function verifyPromotion(promotionId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .update({ verification_status: 'verified' })
    .eq('id', promotionId)
  if (error) throw error
}

export async function unverifyPromotion(promotionId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .update({ verification_status: 'unverified' })
    .eq('id', promotionId)
  if (error) throw error
}

// ============================================
// MERGE WRESTLERS
// ============================================

export async function mergeWrestlers(keepId: string, removeId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('merge_wrestlers', { keep_id: keepId, remove_id: removeId })
  if (error) throw error
}

// ============================================
// BULK IMPORT EVENTS
// ============================================

export async function bulkImportEvents(events: Array<{
  name: string
  event_date: string
  promotion_id?: string
  venue_name?: string
  city?: string
  state?: string
  ticket_url?: string
  doors_time?: string
  event_time?: string
}>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .insert(events.map(e => ({ ...e, status: 'upcoming' })))
    .select('id, name')

  if (error) throw error
  return data
}

export async function getAllPromotionsList() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('id, name, slug')
    .order('name')

  if (error) { console.error(error); return [] }
  return data || []
}

// ============================================
// CREATE WRESTLER / PROMOTION
// ============================================

export async function createWrestlerAdmin(wrestler: {
  name: string
  slug: string
  bio?: string
  hometown?: string
  pwi_ranking?: number | null
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wrestlers')
    .insert(wrestler)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createPromotionAdmin(promotion: {
  name: string
  slug: string
  city?: string
  state?: string
  website?: string
  description?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .insert(promotion)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================
// ADMIN PHOTO UPLOADS
// ============================================

export async function uploadWrestlerPhotoAdmin(wrestlerId: string, file: File) {
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

  const urlWithBust = `${publicUrl}?v=${Date.now()}`
  await updateWrestlerAdmin(wrestlerId, { photo_url: urlWithBust })
  return urlWithBust
}

export async function uploadWrestlerRenderAdmin(wrestlerId: string, file: File) {
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
  await updateWrestlerAdmin(wrestlerId, { render_url: urlWithBust })
  return urlWithBust
}

export async function uploadPromotionLogoAdmin(promotionId: string, file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const filePath = `promotion-logos/${promotionId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath)

  const urlWithBust = `${publicUrl}?v=${Date.now()}`
  await updatePromotionAdmin(promotionId, { logo_url: urlWithBust })
  return urlWithBust
}

// ============================================
// PROMOTION GROUPS (Tag Teams, Trios, Stables)
// ============================================

export async function getPromotionGroupsAdmin(promotionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotion_groups')
    .select(`
      *,
      promotion_group_members (
        id, wrestler_id, sort_order,
        wrestlers (id, name, slug, photo_url)
      )
    `)
    .eq('promotion_id', promotionId)
    .order('sort_order', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createGroupAdmin(data: {
  promotion_id: string
  name: string
  type: string
}) {
  const supabase = createClient()
  const { data: group, error } = await supabase
    .from('promotion_groups')
    .insert(data)
    .select(`
      *,
      promotion_group_members (
        id, wrestler_id, sort_order,
        wrestlers (id, name, slug, photo_url)
      )
    `)
    .single()
  if (error) throw error
  return group
}

export async function updateGroupAdmin(groupId: string, updates: { name?: string; type?: string; is_active?: boolean }) {
  const supabase = createClient()
  const { error } = await supabase.from('promotion_groups').update(updates).eq('id', groupId)
  if (error) throw error
}

export async function deleteGroupAdmin(groupId: string) {
  await adminApi({ action: 'delete', table: 'promotion_groups', id: groupId })
}

export async function addGroupMemberAdmin(groupId: string, wrestlerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotion_group_members')
    .insert({ group_id: groupId, wrestler_id: wrestlerId })
    .select(`*, wrestlers (id, name, slug, photo_url)`)
    .single()
  if (error) throw error
  return data
}

export async function removeGroupMemberAdmin(memberId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('promotion_group_members').delete().eq('id', memberId)
  if (error) throw error
}

// ============================================
// PROFESSIONAL / CREW ADMIN
// ============================================

export async function searchProfessionalsAdmin(query: string, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('professionals')
    .select('id, name, slug, role, photo_url, verification_status, claimed_by, claim_code')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getProfessionalFull(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('professionals').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateProfessionalAdmin(id: string, updates: Record<string, any>) {
  const supabase = createClient()
  const { error } = await supabase.from('professionals').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteProfessional(id: string) {
  await adminApi({ action: 'delete', table: 'professionals', id })
}

export async function verifyProfessional(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('professionals').update({ verification_status: 'verified' }).eq('id', id)
  if (error) throw error
}

export async function unverifyProfessional(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('professionals').update({ verification_status: 'unverified' }).eq('id', id)
  if (error) throw error
}

export async function getPendingProfessionalClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('professional_claims')
    .select('*, professionals (id, name, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllProfessionalClaims() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('professional_claims')
    .select('*, professionals (id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

export async function approveProfessionalClaim(claimId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('approve_professional_claim', { claim_id: claimId })
  if (error) throw error
}

export async function rejectProfessionalClaim(claimId: string, notes?: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('professional_claims')
    .update({ status: 'rejected', admin_notes: notes || null, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
  if (error) throw error
}
