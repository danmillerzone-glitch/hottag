-- Co-Promoted Events: junction table for many-to-many events <-> promotions
CREATE TABLE event_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, promotion_id)
);

CREATE INDEX idx_event_promotions_event ON event_promotions(event_id);
CREATE INDEX idx_event_promotions_promotion ON event_promotions(promotion_id);

-- RLS
ALTER TABLE event_promotions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read" ON event_promotions FOR SELECT USING (true);

-- INSERT: user owns the promotion being linked, OR is already a co-promoter on this event
CREATE POLICY "Promoter insert" ON event_promotions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.id = event_promotions.promotion_id
    AND p.claimed_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM event_promotions ep
    JOIN promotions p ON p.id = ep.promotion_id
    WHERE ep.event_id = event_promotions.event_id
    AND p.claimed_by = auth.uid()
  )
);

-- DELETE: user is a co-promoter on this event
CREATE POLICY "Promoter delete" ON event_promotions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM event_promotions ep
    JOIN promotions p ON p.id = ep.promotion_id
    WHERE ep.event_id = event_promotions.event_id
    AND p.claimed_by = auth.uid()
  )
);

-- Backfill from existing events.promotion_id
INSERT INTO event_promotions (event_id, promotion_id)
SELECT id, promotion_id FROM events WHERE promotion_id IS NOT NULL
ON CONFLICT DO NOTHING;
