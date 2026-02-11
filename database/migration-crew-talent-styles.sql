-- 1. Announced Crew for events
CREATE TABLE IF NOT EXISTS event_announced_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
  announcement_note text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, professional_id)
);

ALTER TABLE event_announced_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_announced_crew_read" ON event_announced_crew
  FOR SELECT USING (true);

CREATE POLICY "event_announced_crew_insert" ON event_announced_crew
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN promotions p ON e.promotion_id = p.id
      LEFT JOIN promotion_admins pa ON pa.promotion_id = p.id
      WHERE e.id = event_id
      AND (p.claimed_by = auth.uid() OR pa.user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "event_announced_crew_update" ON event_announced_crew
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN promotions p ON e.promotion_id = p.id
      LEFT JOIN promotion_admins pa ON pa.promotion_id = p.id
      WHERE e.id = event_announced_crew.event_id
      AND (p.claimed_by = auth.uid() OR pa.user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "event_announced_crew_delete" ON event_announced_crew
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN promotions p ON e.promotion_id = p.id
      LEFT JOIN promotion_admins pa ON pa.promotion_id = p.id
      WHERE e.id = event_announced_crew.event_id
      AND (p.claimed_by = auth.uid() OR pa.user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 2. Wrestling Style for wrestlers
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS wrestling_style text[];

-- 3. New crew roles (video_editor, camera_operator) are handled in code constants
