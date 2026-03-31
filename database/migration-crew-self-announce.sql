-- Add self_announced column to event_announced_crew
-- Mirrors the existing self_announced column on event_announced_talent
ALTER TABLE event_announced_crew
ADD COLUMN IF NOT EXISTS self_announced BOOLEAN DEFAULT FALSE;

-- RLS: Allow crew members to self-announce at events
-- (insert into event_announced_crew where professional_id matches their claimed page)
CREATE POLICY "Crew can self-announce at events"
  ON event_announced_crew
  FOR INSERT
  WITH CHECK (
    self_announced = true
    AND EXISTS (
      SELECT 1 FROM professionals
      WHERE professionals.id = professional_id
        AND professionals.claimed_by = auth.uid()
    )
  );

-- RLS: Allow crew members to delete their own self-announcements
CREATE POLICY "Crew can remove own self-announcements"
  ON event_announced_crew
  FOR DELETE
  USING (
    self_announced = true
    AND EXISTS (
      SELECT 1 FROM professionals
      WHERE professionals.id = professional_id
        AND professionals.claimed_by = auth.uid()
    )
  );

-- RLS: Allow crew members to read their own announcements
-- (public read may already exist, but this ensures self-announced records are visible)
CREATE POLICY "Crew can read own announcements"
  ON event_announced_crew
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals
      WHERE professionals.id = professional_id
        AND professionals.claimed_by = auth.uid()
    )
  );
