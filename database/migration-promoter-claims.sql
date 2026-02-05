-- ============================================
-- HOTTAG MIGRATION: Promoter Claim System
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ADD streaming_url TO EVENTS
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS streaming_url TEXT;

-- ============================================
-- 2. PROMOTION CLAIMS TABLE
-- ============================================

CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE promotion_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who is claiming
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    
    -- What they're claiming
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    
    -- Verification info
    contact_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255), -- e.g., "Owner", "Booker", "Social Media Manager"
    proof_description TEXT, -- Free text: how they can prove ownership
    website_or_social VARCHAR(500), -- Link to their official page/social
    
    -- Status
    status claim_status DEFAULT 'pending',
    admin_notes TEXT, -- Notes from admin during review
    reviewed_by UUID, -- Admin who reviewed
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotion_claims_user ON promotion_claims(user_id);
CREATE INDEX idx_promotion_claims_promotion ON promotion_claims(promotion_id);
CREATE INDEX idx_promotion_claims_status ON promotion_claims(status);

-- Prevent duplicate pending claims
CREATE UNIQUE INDEX idx_unique_pending_claim 
    ON promotion_claims(user_id, promotion_id) 
    WHERE status = 'pending';

-- ============================================
-- 3. ADD FIELDS TO PROMOTIONS FOR CLAIM SYSTEM
-- ============================================

-- These may already exist from the full schema, so use IF NOT EXISTS pattern
DO $$ 
BEGIN
    -- Add facebook_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'facebook_url') THEN
        ALTER TABLE promotions ADD COLUMN facebook_url VARCHAR(500);
    END IF;
    
    -- Add youtube_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'youtube_url') THEN
        ALTER TABLE promotions ADD COLUMN youtube_url VARCHAR(500);
    END IF;
    
    -- Add claimed_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'claimed_by') THEN
        ALTER TABLE promotions ADD COLUMN claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add verified_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'verified_at') THEN
        ALTER TABLE promotions ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- 4. ADD MATCHES TABLE (richer than event_wrestlers)
-- ============================================

CREATE TABLE IF NOT EXISTS event_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Match info
    match_title VARCHAR(500), -- e.g., "GCW World Championship Match"
    match_type VARCHAR(255), -- "Singles", "Tag Team", "Triple Threat", etc.
    match_stipulation VARCHAR(255), -- "No DQ", "Cage Match", etc.
    match_order INTEGER, -- Position on the card
    
    -- Championship info
    is_title_match BOOLEAN DEFAULT FALSE,
    championship_name VARCHAR(255),
    
    -- Post-event results
    result_summary TEXT, -- e.g., "Mox def. Cardona via pinfall"
    match_rating DECIMAL(3, 2), -- Star rating
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_matches_event ON event_matches(event_id);

-- Match participants (links matches to wrestlers)
CREATE TABLE IF NOT EXISTS match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES event_matches(id) ON DELETE CASCADE,
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    
    -- Participant info
    team_number INTEGER DEFAULT 1, -- For tag matches: team 1 vs team 2
    is_winner BOOLEAN DEFAULT FALSE,
    entrance_order INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(match_id, wrestler_id)
);

CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_wrestler ON match_participants(wrestler_id);

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-update updated_at on promotion_claims
CREATE TRIGGER update_promotion_claims_updated_at 
    BEFORE UPDATE ON promotion_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on event_matches
CREATE TRIGGER update_event_matches_updated_at 
    BEFORE UPDATE ON event_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE promotion_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- Promotion claims: users can see their own, create their own
CREATE POLICY "Users can view their own claims"
    ON promotion_claims FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
    ON promotion_claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Event matches: anyone can read, promotion owners can manage
CREATE POLICY "Anyone can view matches"
    ON event_matches FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage matches"
    ON event_matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN promotions p ON e.promotion_id = p.id
            WHERE e.id = event_matches.event_id
            AND p.claimed_by = auth.uid()
        )
    );

-- Match participants: anyone can read, promotion owners can manage
CREATE POLICY "Anyone can view match participants"
    ON match_participants FOR SELECT
    USING (true);

CREATE POLICY "Promotion owners can manage match participants"
    ON match_participants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM event_matches em
            JOIN events e ON em.event_id = e.id
            JOIN promotions p ON e.promotion_id = p.id
            WHERE em.id = match_participants.match_id
            AND p.claimed_by = auth.uid()
        )
    );

-- Events: promotion owners can update their own events
CREATE POLICY "Promotion owners can update their events"
    ON events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM promotions p
            WHERE p.id = events.promotion_id
            AND p.claimed_by = auth.uid()
        )
    );

-- Promotions: claimed owners can update their own promotion
CREATE POLICY "Promotion owners can update their promotion"
    ON promotions FOR UPDATE
    USING (claimed_by = auth.uid());

-- ============================================
-- 7. HELPER FUNCTION: Approve a claim
-- ============================================

CREATE OR REPLACE FUNCTION approve_promotion_claim(claim_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_promotion_id UUID;
BEGIN
    -- Get claim details
    SELECT user_id, promotion_id INTO v_user_id, v_promotion_id
    FROM promotion_claims
    WHERE id = claim_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim not found or not pending';
    END IF;
    
    -- Update claim status
    UPDATE promotion_claims 
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = claim_id;
    
    -- Update promotion
    UPDATE promotions 
    SET claimed_by = v_user_id, 
        verification_status = 'verified',
        verified_at = NOW()
    WHERE id = v_promotion_id;
    
    -- Reject any other pending claims for this promotion
    UPDATE promotion_claims 
    SET status = 'rejected', 
        admin_notes = 'Another claim was approved',
        reviewed_at = NOW()
    WHERE promotion_id = v_promotion_id 
        AND id != claim_id 
        AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Promoter claim system migration completed successfully!';
END $$;
