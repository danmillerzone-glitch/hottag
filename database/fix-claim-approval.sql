-- Fix the approve_promotion_claim function to also insert into promotion_admins
CREATE OR REPLACE FUNCTION approve_promotion_claim(claim_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  -- Get the claim
  SELECT * INTO v_claim FROM promotion_claims WHERE id = claim_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  -- Update claim status
  UPDATE promotion_claims
  SET status = 'approved',
      reviewed_at = now()
  WHERE id = claim_id;

  -- Update promotion verification
  UPDATE promotions
  SET verification_status = 'verified'
  WHERE id = v_claim.promotion_id;

  -- Add user as admin/owner (if not already there)
  INSERT INTO promotion_admins (promotion_id, user_id, role)
  VALUES (v_claim.promotion_id, v_claim.user_id, 'owner')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Also backfill: add any approved claims that are missing from promotion_admins
INSERT INTO promotion_admins (promotion_id, user_id, role)
SELECT pc.promotion_id, pc.user_id, 'owner'
FROM promotion_claims pc
WHERE pc.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM promotion_admins pa
    WHERE pa.promotion_id = pc.promotion_id
      AND pa.user_id = pc.user_id
  );
