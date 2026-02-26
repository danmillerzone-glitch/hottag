-- ============================================
-- FIX: Claim approval / code redemption must
--       complete onboarding in user_profiles
-- ============================================
-- Without this, users who claim a page get stuck
-- in an onboarding redirect loop because AuthGate
-- sees onboarding_completed = false.
-- ============================================

-- 1. redeem_wrestler_claim_code
CREATE OR REPLACE FUNCTION redeem_wrestler_claim_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wrestler_id UUID;
  v_wrestler_name TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, name INTO v_wrestler_id, v_wrestler_name
  FROM wrestlers
  WHERE claim_code = code
    AND (claimed_by IS NULL)
  LIMIT 1;

  IF v_wrestler_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code or profile already claimed');
  END IF;

  UPDATE wrestlers
  SET claimed_by = v_user_id,
      verification_status = 'verified',
      claim_code = NULL
  WHERE id = v_wrestler_id;

  -- Mark onboarding complete so AuthGate allows dashboard access
  UPDATE user_profiles
  SET user_type = 'wrestler',
      onboarding_completed = true,
      onboarding_step = 99
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'wrestler_id', v_wrestler_id, 'wrestler_name', v_wrestler_name);
END;
$$;

-- 2. approve_wrestler_claim
CREATE OR REPLACE FUNCTION approve_wrestler_claim(claim_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_wrestler_id UUID;
BEGIN
    SELECT user_id, wrestler_id INTO v_user_id, v_wrestler_id
    FROM wrestler_claims
    WHERE id = claim_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim not found or not pending';
    END IF;

    UPDATE wrestler_claims
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = claim_id;

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

    -- Mark onboarding complete
    UPDATE user_profiles
    SET user_type = 'wrestler',
        onboarding_completed = true,
        onboarding_step = 99
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. redeem_promotion_claim_code
CREATE OR REPLACE FUNCTION redeem_promotion_claim_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promotion_id UUID;
  v_promotion_name TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, name INTO v_promotion_id, v_promotion_name
  FROM promotions
  WHERE claim_code = code
    AND (claimed_by IS NULL)
  LIMIT 1;

  IF v_promotion_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code or promotion already claimed');
  END IF;

  UPDATE promotions
  SET claimed_by = v_user_id,
      verification_status = 'verified',
      claim_code = NULL
  WHERE id = v_promotion_id;

  -- Mark onboarding complete
  UPDATE user_profiles
  SET user_type = 'promoter',
      onboarding_completed = true,
      onboarding_step = 99
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'promotion_id', v_promotion_id, 'promotion_name', v_promotion_name);
END;
$$;

-- 4. approve_promotion_claim
CREATE OR REPLACE FUNCTION approve_promotion_claim(claim_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  SELECT * INTO v_claim FROM promotion_claims WHERE id = claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  UPDATE promotion_claims
  SET status = 'approved',
      reviewed_at = now()
  WHERE id = claim_id;

  UPDATE promotions
  SET verification_status = 'verified'
  WHERE id = v_claim.promotion_id;

  -- Add user as admin/owner (if not already there)
  INSERT INTO promotion_admins (promotion_id, user_id, role)
  VALUES (v_claim.promotion_id, v_claim.user_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Mark onboarding complete
  UPDATE user_profiles
  SET user_type = 'promoter',
      onboarding_completed = true,
      onboarding_step = 99
  WHERE id = v_claim.user_id;
END;
$$;

-- 5. approve_professional_claim
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

  -- Mark onboarding complete
  UPDATE user_profiles
  SET user_type = 'crew',
      onboarding_completed = true,
      onboarding_step = 99
  WHERE id = v_claim.user_id;
END;
$$;
