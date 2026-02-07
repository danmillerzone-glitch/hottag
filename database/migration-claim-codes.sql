-- Add claim_code columns
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE;

-- Function to redeem a wrestler claim code
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

  -- Find wrestler with this code that isn't already claimed
  SELECT id, name INTO v_wrestler_id, v_wrestler_name
  FROM wrestlers
  WHERE claim_code = code
    AND (claimed_by IS NULL)
  LIMIT 1;

  IF v_wrestler_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code or profile already claimed');
  END IF;

  -- Claim the wrestler
  UPDATE wrestlers
  SET claimed_by = v_user_id, 
      verification_status = 'verified',
      claim_code = NULL
  WHERE id = v_wrestler_id;

  RETURN json_build_object('success', true, 'wrestler_id', v_wrestler_id, 'wrestler_name', v_wrestler_name);
END;
$$;

-- Function to redeem a promotion claim code
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

  -- Find promotion with this code that isn't already claimed
  SELECT id, name INTO v_promotion_id, v_promotion_name
  FROM promotions
  WHERE claim_code = code
    AND (claimed_by IS NULL)
  LIMIT 1;

  IF v_promotion_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code or promotion already claimed');
  END IF;

  -- Claim the promotion
  UPDATE promotions
  SET claimed_by = v_user_id,
      verification_status = 'verified',
      claim_code = NULL
  WHERE id = v_promotion_id;

  RETURN json_build_object('success', true, 'promotion_id', v_promotion_id, 'promotion_name', v_promotion_name);
END;
$$;
