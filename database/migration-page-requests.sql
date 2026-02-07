-- ============================================
-- PAGE REQUESTS (Request wrestler/promotion pages)
-- ============================================

CREATE TABLE IF NOT EXISTS page_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'wrestler' or 'promotion'
  name TEXT NOT NULL,
  details TEXT,
  social_links TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_requests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit requests
CREATE POLICY "auth_insert_requests" ON page_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can see their own requests
CREATE POLICY "users_read_own_requests" ON page_requests
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

-- Admins can see and manage all requests
CREATE POLICY "admin_read_requests" ON page_requests
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_update_requests" ON page_requests
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_delete_requests" ON page_requests
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));
