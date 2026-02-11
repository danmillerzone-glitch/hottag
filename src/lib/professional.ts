import { createClient } from '@/lib/supabase-browser'

// ============================================
// CLAIMS
// ============================================

export async function submitProfessionalClaim(data: {
  professional_id: string
  contact_name: string
  role_title?: string
  proof_description?: string
  website_or_social?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: claim, error } = await supabase
    .from('professional_claims')
    .insert({
      professional_id: data.professional_id,
      user_id: user.id,
      user_email: user.email || '',
      contact_name: data.contact_name,
      role_title: data.role_title || null,
      proof_description: data.proof_description || null,
      website_or_social: data.website_or_social || null,
    })
    .select()
    .single()

  if (error) throw error
  return claim
}

export async function claimWithCode(professionalId: string, code: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: pro } = await supabase
    .from('professionals')
    .select('claim_code')
    .eq('id', professionalId)
    .single()

  if (!pro || pro.claim_code !== code) throw new Error('Invalid claim code')

  const { error } = await supabase
    .from('professionals')
    .update({
      claimed_by: user.id,
      claim_code: null,
      verification_status: 'verified',
    })
    .eq('id', professionalId)

  if (error) throw error
}

export async function getExistingProfessionalClaim(professionalId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('professional_claims')
    .select('*')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking professional claim:', error)
    return null
  }
  return data
}

export async function redeemProfessionalClaimCode(code: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Find the professional with this claim code
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, name, claim_code')
    .eq('claim_code', code)
    .maybeSingle()

  if (!pro) throw new Error('Invalid claim code')

  const { error } = await supabase
    .from('professionals')
    .update({
      claimed_by: user.id,
      claim_code: null,
      verification_status: 'verified',
    })
    .eq('id', pro.id)

  if (error) throw error
  return { success: true, professional_id: pro.id, professional_name: pro.name } as { success: boolean; error?: string; professional_id?: string; professional_name?: string }
}

// ============================================
// DASHBOARD
// ============================================

export async function getProfessionalDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('claimed_by', user.id)
    .single()

  if (!professional) return null

  const { count: followerCount } = await supabase
    .from('user_follows_professional')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professional.id)

  return {
    professional,
    followerCount: followerCount || 0,
  }
}

export async function updateProfessional(professionalId: string, updates: {
  name?: string
  moniker?: string | null
  bio?: string | null
  role?: string[]
  hometown?: string | null
  residence?: string | null
  photo_url?: string | null
  website?: string | null
  booking_email?: string | null
  twitter_handle?: string | null
  instagram_handle?: string | null
  tiktok_handle?: string | null
  youtube_url?: string | null
  facebook_url?: string | null
  bluesky_handle?: string | null
  patreon_url?: string | null
  video_section_title?: string | null
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('professionals')
    .update(updates)
    .eq('id', professionalId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// WORKS WITH (Promotion associations)
// ============================================

export async function requestWorksWithPromotion(professionalId: string, promotionId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('professional_promotions').insert({
    professional_id: professionalId,
    promotion_id: promotionId,
    status: 'pending',
    requested_by: 'professional',
  })
  if (error) throw error
}

export async function acceptWorksWithRequest(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('professional_promotions')
    .update({ status: 'accepted' })
    .eq('id', id)
  if (error) throw error
}

export async function rejectWorksWithRequest(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('professional_promotions')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) throw error
}
