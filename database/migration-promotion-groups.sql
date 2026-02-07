-- ============================================
-- PROMOTION GROUPS (Tag Teams, Trios, Stables)
-- ============================================

-- Groups table
CREATE TABLE IF NOT EXISTS promotion_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'tag_team', -- tag_team, trio, stable
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members junction table
CREATE TABLE IF NOT EXISTS promotion_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES promotion_groups(id) ON DELETE CASCADE,
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, wrestler_id)
);

-- Add champion_group_id to championships (for tag/trio/stable champions)
ALTER TABLE promotion_championships 
  ADD COLUMN IF NOT EXISTS champion_group_id UUID REFERENCES promotion_groups(id) ON DELETE SET NULL;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE promotion_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_group_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read active groups
CREATE POLICY "Anyone can read groups" ON promotion_groups
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read group members" ON promotion_group_members
  FOR SELECT USING (true);

-- Admins can manage groups
CREATE POLICY "admin_insert_groups" ON promotion_groups
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_groups" ON promotion_groups
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "admin_delete_groups" ON promotion_groups
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "admin_insert_group_members" ON promotion_group_members
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_group_members" ON promotion_group_members
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "admin_delete_group_members" ON promotion_group_members
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Promoters who own the promotion can manage their groups
CREATE POLICY "promoter_insert_groups" ON promotion_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM promotions 
      WHERE id = promotion_id AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "promoter_update_groups" ON promotion_groups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotions 
      WHERE id = promotion_id AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "promoter_delete_groups" ON promotion_groups
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotions 
      WHERE id = promotion_id AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "promoter_insert_group_members" ON promotion_group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM promotion_groups pg
      JOIN promotions p ON p.id = pg.promotion_id
      WHERE pg.id = group_id AND p.claimed_by = auth.uid()
    )
  );

CREATE POLICY "promoter_update_group_members" ON promotion_group_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotion_groups pg
      JOIN promotions p ON p.id = pg.promotion_id
      WHERE pg.id = group_id AND p.claimed_by = auth.uid()
    )
  );

CREATE POLICY "promoter_delete_group_members" ON promotion_group_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promotion_groups pg
      JOIN promotions p ON p.id = pg.promotion_id
      WHERE pg.id = group_id AND p.claimed_by = auth.uid()
    )
  );
