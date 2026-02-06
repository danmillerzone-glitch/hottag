-- ============================================
-- HOTTAG MIGRATION: Wrestler Claim System
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. WRESTLER CLAIMS TABLE
-- ============================================

CREATE TABLE wrestler_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who is claiming
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    
    -- What they're claiming
    wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
    
    -- Verification info
    contact_name VARCHAR(255) NOT NULL,
    ring_name VARCHAR(255), -- Their ring name (should match wrestler)
    proof_description TEXT, -- Free text: how they can prove identity
    website_or_social VARCHAR(500), -- Link to their official social
    
    -- Status
    status claim_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wrestler_claims_user ON wrestler_claims(user_id);
CREATE INDEX idx_wrestler_claims_wrestler ON wrestler_claims(wrestler_id);
CREATE INDEX idx_wrestler_claims_status ON wrestler_claims(status);

-- Prevent duplicate pending claims
CREATE UNIQUE INDEX idx_unique_pending_wrestler_claim 
    ON wrestler_claims(user_id, wrestler_id) 
    WHERE status = 'pending';

-- ============================================
-- 2. ENSURE wrestlers HAS claimed_by
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrestlers' AND column_name = 'claimed_by') THEN
        ALTER TABLE wrestlers ADD COLUMN claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 3. TRIGGERS
-- ============================================

CREATE TRIGGER update_wrestler_claims_updated_at 
    BEFORE UPDATE ON wrestler_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE wrestler_claims ENABLE ROW LEVEL SECURITY;

-- Users can see their own claims
CREATE POLICY "Users can view their own wrestler claims"
    ON wrestler_claims FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create claims
CREATE POLICY "Users can create wrestler claims"
    ON wrestler_claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Wrestlers: claimed owners can update their own wrestler profile
CREATE POLICY "Wrestlers can update their own profile"
    ON wrestlers FOR UPDATE
    USING (claimed_by = auth.uid());

-- ============================================
-- 5. HELPER FUNCTION: Approve a wrestler claim
-- ============================================

CREATE OR REPLACE FUNCTION approve_wrestler_claim(claim_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_wrestler_id UUID;
BEGIN
    -- Get claim details
    SELECT user_id, wrestler_id INTO v_user_id, v_wrestler_id
    FROM wrestler_claims
    WHERE id = claim_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim not found or not pending';
    END IF;
    
    -- Update claim status
    UPDATE wrestler_claims 
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = claim_id;
    
    -- Update wrestler
    UPDATE wrestlers 
    SET claimed_by = v_user_id, 
        verification_status = 'verified',
        verified_at = NOW()
    WHERE id = v_wrestler_id;
    
    -- Reject any other pending claims for this wrestler
    UPDATE wrestler_claims 
    SET status = 'rejected', 
        admin_notes = 'Another claim was approved',
        reviewed_at = NOW()
    WHERE wrestler_id = v_wrestler_id 
        AND id != claim_id 
        AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. STORAGE BUCKET FOR WRESTLER PHOTOS
-- ============================================

-- Create storage bucket for wrestler photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('wrestler-photos', 'wrestler-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view wrestler photos
CREATE POLICY "Public wrestler photo access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wrestler-photos');

-- Allow authenticated users to upload their own wrestler photo
CREATE POLICY "Wrestlers can upload their photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'wrestler-photos'
        AND auth.role() = 'authenticated'
    );

-- Allow wrestlers to update their photos
CREATE POLICY "Wrestlers can update their photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'wrestler-photos'
        AND auth.role() = 'authenticated'
    );

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Wrestler claim system migration completed successfully!';
END $$;
