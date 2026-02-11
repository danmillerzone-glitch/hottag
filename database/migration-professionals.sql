-- ============================================
-- PROFESSIONALS / CREW SYSTEM
-- ============================================

-- Core professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'other',
  moniker TEXT,
  bio TEXT,
  hometown TEXT,
  residence TEXT,
  photo_url TEXT,
  website TEXT,
  booking_email TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  bluesky_handle TEXT,
  patreon_url TEXT,
  video_section_title TEXT,
  claimed_by UUID REFERENCES auth.users(id),
  claim_code TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professionals_public_read" ON professionals FOR SELECT USING (true);
CREATE POLICY "professionals_owner_update" ON professionals FOR UPDATE USING (claimed_by = auth.uid());

CREATE INDEX idx_professionals_slug ON professionals(slug);
CREATE INDEX idx_professionals_role ON professionals(role);
CREATE INDEX idx_professionals_claimed ON professionals(claimed_by) WHERE claimed_by IS NOT NULL;

-- Professional claims (same pattern as wrestler claims)
CREATE TABLE IF NOT EXISTS professional_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  role_title TEXT,
  proof_description TEXT,
  website_or_social TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professional_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_claims_own" ON professional_claims FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pro_claims_insert" ON professional_claims FOR INSERT WITH CHECK (user_id = auth.uid());

-- Follow professionals
CREATE TABLE IF NOT EXISTS user_follows_professional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, professional_id)
);

ALTER TABLE user_follows_professional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_pro_read" ON user_follows_professional FOR SELECT USING (true);
CREATE POLICY "follow_pro_own" ON user_follows_professional FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Portfolio items (for showcasing work - no buy link required)
CREATE TABLE IF NOT EXISTS professional_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professional_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_read" ON professional_portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_owner" ON professional_portfolio FOR ALL USING (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
) WITH CHECK (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
);

-- Professional merch items
CREATE TABLE IF NOT EXISTS professional_merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  price TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professional_merch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_merch_read" ON professional_merch_items FOR SELECT USING (true);
CREATE POLICY "pro_merch_owner" ON professional_merch_items FOR ALL USING (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
) WITH CHECK (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
);

-- Event crew (tag professionals on events)
CREATE TABLE IF NOT EXISTS event_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  role_at_event TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, professional_id)
);

ALTER TABLE event_crew ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_crew_read" ON event_crew FOR SELECT USING (true);
CREATE POLICY "event_crew_promoter" ON event_crew FOR ALL USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN promotion_admins pa ON pa.promotion_id = e.promotion_id
    WHERE pa.user_id = auth.uid()
  )
) WITH CHECK (
  event_id IN (
    SELECT e.id FROM events e
    JOIN promotion_admins pa ON pa.promotion_id = e.promotion_id
    WHERE pa.user_id = auth.uid()
  )
);

-- "Works with" promotion associations (requires promotion acceptance)
CREATE TABLE IF NOT EXISTS professional_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_by TEXT DEFAULT 'professional' CHECK (requested_by IN ('professional', 'promotion')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, promotion_id)
);

ALTER TABLE professional_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_promo_read" ON professional_promotions FOR SELECT USING (true);
CREATE POLICY "pro_promo_professional" ON professional_promotions FOR INSERT WITH CHECK (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
);
CREATE POLICY "pro_promo_accept" ON professional_promotions FOR UPDATE USING (
  promotion_id IN (SELECT promotion_id FROM promotion_admins WHERE user_id = auth.uid())
);

-- Profile videos for professionals (reuse existing table)
-- profile_videos already supports wrestler_id and promotion_id
-- Add professional_id column
ALTER TABLE profile_videos ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE;

-- Drop and recreate the constraint to include professional_id
ALTER TABLE profile_videos DROP CONSTRAINT IF EXISTS one_owner;
ALTER TABLE profile_videos ADD CONSTRAINT one_owner CHECK (
  (CASE WHEN wrestler_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN promotion_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN professional_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- RLS for professional videos
CREATE POLICY "videos_professional_owner" ON profile_videos FOR ALL USING (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
) WITH CHECK (
  professional_id IN (SELECT id FROM professionals WHERE claimed_by = auth.uid())
);

CREATE INDEX idx_profile_videos_professional ON profile_videos(professional_id) WHERE professional_id IS NOT NULL;

-- Approve professional claim function
CREATE OR REPLACE FUNCTION approve_professional_claim(claim_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  SELECT * INTO v_claim FROM professional_claims WHERE id = claim_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim not found'; END IF;

  UPDATE professional_claims SET status = 'approved', reviewed_at = now() WHERE id = claim_id;
  UPDATE professionals SET claimed_by = v_claim.user_id, verification_status = 'verified' WHERE id = v_claim.professional_id;
END;
$$;
