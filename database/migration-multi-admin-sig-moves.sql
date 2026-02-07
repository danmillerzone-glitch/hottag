-- ============================================
-- PROMOTION ADMINS (Multiple users per promotion)
-- ============================================

CREATE TABLE IF NOT EXISTS promotion_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'editor', -- editor, admin
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promotion_id, user_id)
);

ALTER TABLE promotion_admins ENABLE ROW LEVEL SECURITY;

-- Promotion owner can manage admins
CREATE POLICY "owner_manage_admins" ON promotion_admins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotions WHERE id = promotion_id AND claimed_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM promotions WHERE id = promotion_id AND claimed_by = auth.uid()
    )
  );

-- Admins can read their own memberships
CREATE POLICY "users_read_own_admin" ON promotion_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Site admins can manage all
CREATE POLICY "site_admin_manage_admins" ON promotion_admins
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- SIGNATURE MOVES for wrestlers
-- ============================================

ALTER TABLE wrestlers 
  ADD COLUMN IF NOT EXISTS signature_moves TEXT[];

-- ============================================
-- Update events RLS to allow promotion_admins to edit events
-- ============================================

-- Drop existing promoter event update policy if exists, then recreate with promotion_admins support
DO $$
BEGIN
  -- Try to drop existing policy
  BEGIN
    DROP POLICY IF EXISTS "promoter_update_events" ON events;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

CREATE POLICY "promoter_update_events" ON events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotions WHERE id = promotion_id AND claimed_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM promotion_admins pa
      JOIN promotions p ON p.id = pa.promotion_id
      WHERE p.id = promotion_id AND pa.user_id = auth.uid()
    )
  );
